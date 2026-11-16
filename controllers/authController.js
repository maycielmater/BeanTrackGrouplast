import bcrypt from "bcrypt";
import User from "../models/User.js";

export function showLogin(req, res) {
  if (req.session.user) return res.redirect(req.session.user.role === "admin" ? "/admin" : "/");
  res.render("login", { title: "Login" });
}
export function showRegister(req, res) { res.render("register", { title: "Create account" }); }
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      req.session.notice = "Complete all fields. Password must be at least 6 characters.";
      return res.redirect("/register");
    }
    const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (exists) {
      req.session.notice = "That email is already registered.";
      return res.redirect("/register");
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role: "customer" });
    req.session.notice = "Account created. You can now log in.";
    res.redirect("/login");
  } catch (error) { console.error(error); res.status(500).send("Unable to register."); }
}
export async function login(req, res) {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) {
      req.session.notice = "Incorrect email or password.";
      return res.redirect("/login");
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.redirect(user.role === "admin" ? "/admin" : "/");
  } catch (error) { console.error(error); res.status(500).send("Unable to log in."); }
}
export function logout(req, res) {
  req.session.destroy(() => res.redirect("/"));
}