import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import axios from "axios";
import prisma from "../../config/prisma/prisma.js";
import { getKeycloakClientSecret } from "../../utils/keycloak/getKeycloakClientSecret.js";

const rawKeycloakUrl = process.env.KEYCLOAK_URL || "http://127.0.0.1:8080/auth";
const KEYCLOAK_INTERNAL_URL = rawKeycloakUrl.replace("localhost", "127.0.0.1");
const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";

const keycloakJwksClient = jwksClient({
  jwksUri: `${KEYCLOAK_INTERNAL_URL}/realms/${REALM_NAME}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// Extend Express Request
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

// User memory cache
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Allowed issuers covering both Docker internal loopback and browser host
const VALID_ISSUERS: [string, ...string[]] = [
  `http://localhost:8080/auth/realms/${REALM_NAME}`,
  `http://127.0.0.1:8080/auth/realms/${REALM_NAME}`,
  `${KEYCLOAK_INTERNAL_URL}/realms/${REALM_NAME}`,
];

/**
 * Helper to fetch and cache user from database
 */
async function resolveUserFromPayload(payload: any) {
  const sub = payload.sub || payload.userId || payload.id;
  const email = payload.email || payload.preferred_username;
  const username = payload.preferred_username || payload.username;

  // Check cache first
  const cacheKey = sub || email;
  if (cacheKey) {
    const cached = userCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - USER_CACHE_TTL) {
      return cached.data;
    }
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(sub ? [{ externalId: sub }, { id: sub }] : []),
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : []),
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      department: true,
      provider: true,
      tenantId: true,
      tenant: {
        select: {
          tenantId: true,
          companyName: true,
        },
      },
    },
  });

  if (user && cacheKey) {
    userCache.set(cacheKey, {
      data: user,
      timestamp: Date.now(),
    });
  }

  return user;
}

// Middleware: Authenticate User & Auto-Refresh Token If Expired
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.access_token ||
      (req.query?.token as string);

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    let decoded: any = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.payload) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    // 1. Support HS256 tokens (Local Auth / Testing)
    if (decoded.header.alg === "HS256") {
      try {
        const verifiedLocal = jwt.verify(
          token,
          process.env.JWT_SECRET || "0a5dbb2dcb25753a0021e65a8fafdd2b1ce45fb3625bc7bfd532d4f7ba3f042b"
        ) as jwt.JwtPayload;

        const user = await resolveUserFromPayload(verifiedLocal);
        if (!user) {
          res.status(401).json({ message: "User not found" });
          return;
        }

        req.user = user;
        return next();
      } catch (err: any) {
        console.warn("[Auth] Local JWT verification failed:", err.message);
      }
    }

    // 2. RS256 Keycloak Token Verification
    let verifiedPayload: any = null;
    let verifyError: any = null;

    try {
      const key = await keycloakJwksClient.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      verifiedPayload = jwt.verify(token, signingKey, {
        algorithms: ["RS256"],
        issuer: VALID_ISSUERS,
      });
    } catch (err: any) {
      verifyError = err;
    }

    // 3. If token expired, attempt automatic refresh using refresh_token cookie
    if ((!verifiedPayload || verifyError?.name === "TokenExpiredError") && req.cookies?.refresh_token) {
      try {
        console.log("[Auth] Access token expired or invalid issuer, attempting auto-refresh via Keycloak...");
        const clientSecret = await getKeycloakClientSecret();
        const tokenResponse = await axios.post(
          `${KEYCLOAK_INTERNAL_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`,
          new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.KEYCLOAK_CLIENT_ID || "dynamic-client",
            client_secret: clientSecret,
            refresh_token: req.cookies.refresh_token,
          }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 5000,
          }
        );

        if (tokenResponse.data?.access_token) {
          token = tokenResponse.data.access_token;
          const newRefreshToken = tokenResponse.data.refresh_token;

          // Set refreshed cookies
          res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 4 * 3600 * 1000,
            path: "/",
          });

          if (newRefreshToken) {
            res.cookie("refresh_token", newRefreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              maxAge: 24 * 3600 * 1000,
              path: "/",
            });
          }

          // Verify the new token
          const newDecoded: any = jwt.decode(token, { complete: true });
          const newKey = await keycloakJwksClient.getSigningKey(newDecoded.header.kid);
          verifiedPayload = jwt.verify(token, newKey.getPublicKey(), {
            algorithms: ["RS256"],
            issuer: VALID_ISSUERS,
          });
          verifyError = null;
          console.log("[Auth] Token refreshed successfully!");
        }
      } catch (refreshErr: any) {
        console.warn("[Auth] Automatic refresh failed:", refreshErr.response?.data || refreshErr.message);
      }
    }

    if (!verifiedPayload) {
      console.error("[Auth] Token verification failed:", verifyError?.message || "Invalid token");
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    // Resolve user from DB
    const user = await resolveUserFromPayload(verifiedPayload);
    if (!user) {
      console.warn(`[Auth] User not found for token sub: ${verifiedPayload.sub}, email: ${verifiedPayload.email}`);
      res.status(401).json({ message: "User not found in tenant system" });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error("[Auth] Authentication middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
