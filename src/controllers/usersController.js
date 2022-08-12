const {
  registration,
  login,
  logout,
  patchUserSubscription,
  uploadUserAvatar,
  verificationUser,
  verifyRepite,
} = require("../services/usersService");

const subscriptionController = async (req, res) => {
  const { id } = req.user;
  const { subscription } = req.body;
  const user = await patchUserSubscription(id, subscription);
  res.json({ user });
};

const registrationController = async (req, res) => {
  const { email, password } = req.body;
  const user = await registration({ email, password });
  res.status(201).json({ user });
};

const verificationController = async (req, res) => {
  const { verificationToken } = req.params;
  await verificationUser(verificationToken);
  res.json({ message: "Verification successful" });
};

const verifyRepiteController = async (req, res) => {
  const { email } = req.body;
  await verifyRepite(email);
  res.json({ message: "Verification email sent" });
};
const loginController = async (req, res) => {
  const { email, password } = req.body;
  const { token, userFind: user } = await login({ email, password });
  res.json({ token, user });
};

const logoutController = async (req, res) => {
  const { id } = req.user;
  await logout(id);
  res.status(204).json({ message: `Logout user: ${id}` });
};

const currentController = async (req, res) => {
  const { id, email, subscription } = req.user;
  res.json({ user: { id, email, subscription } });
};

const uploadUserAvatarController = async (req, res) => {
  const { id } = req.user;
  const avatarURL = await uploadUserAvatar(id, req.file);
  res.json({ avatarURL });
};

module.exports = {
  registrationController,
  loginController,
  logoutController,
  currentController,
  subscriptionController,
  uploadUserAvatarController,
  verificationController,
  verifyRepiteController,
};
