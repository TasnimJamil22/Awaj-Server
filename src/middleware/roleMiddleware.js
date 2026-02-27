//verify roles

 export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: "You do not have permission to access this route" });
    }
    next();
  };
};