import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../../types/typeIndex.js";
import { formatPublicKey } from "../../utils/jwt/formatPubKey.js";
import { isValidRole } from "../../utils/RBAC/isValidRole.js";

const publicKey = formatPublicKey(process.env.KEYCLOAK_RS256_SIG);

export function authorizeRole(requiredrole: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // 1. Fast path: User already authenticated by authenticateUser middleware
    if (req.user) {
      if (req.user.role === requiredrole) {
        return next();
      } else {
        return res.status(403).json({
          message: `Access Denied: User role '${req.user.role}' does not match required role '${requiredrole}'`,
        });
      }
    }

    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies.access_token;

    if (!token) {
      res.status(401).json({ message: "Missing token" });
      return;
    }

    // Validate the provided role
    if (!isValidRole(requiredrole)) {
      res.status(400).json({ message: "Invalid role provided." });
      return;
    }

    // Decode token to inspect roles
    const decoded: any = jwt.decode(token);
    if (decoded && decoded.realm_access?.roles) {
      const roles: string[] = decoded.realm_access.roles;
      if (!roles.includes(requiredrole)) {
        return res.status(403).json({
          message: `Access Denied: User does not have required role ${requiredrole}`,
        });
      }
      return next();
    }

    // Validate public key if available
    if (!publicKey) {
      res.status(500).json({ message: "Public key not configured" });
      return;
    }

    jwt.verify(
      token,
      publicKey,
      { algorithms: ["RS256"] },
      async (err, decodedPayload: any) => {
        if (err || typeof decodedPayload !== "object") {
          return res.status(401).json({
            message: "Token verification failed",
            error: err?.message,
          });
        }

        const role = decodedPayload.realm_access?.roles || [];
        if (!role.includes(requiredrole)) {
          return res.status(403).json({
            message: `Access Denied: User does not have required role ${requiredrole}`,
          });
        }
        next();
      }
    );
  };
}
