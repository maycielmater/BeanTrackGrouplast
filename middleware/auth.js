export function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.session.notice = "Please log in first.";
    return res.redirect("/login");
  }
  next();
}
export function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") return res.status(403).render("error", { title: "Access denied", message: "Admin access is required." });
  next();
}