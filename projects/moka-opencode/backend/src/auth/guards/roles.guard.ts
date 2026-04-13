import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log("=== RolesGuard ===");
    console.log("Required roles:", requiredRoles);
    console.log("User role:", user?.role);
    console.log("User exists:", !!user);
    const hasRole = requiredRoles.includes(user?.role);
    console.log("Has role:", hasRole);
    
    if (!hasRole) {
      throw new ForbiddenException("Insufficient permissions. Required: " + requiredRoles.join(" or ") + ", Got: " + user?.role);
    }
    
    return hasRole;
  }
}
