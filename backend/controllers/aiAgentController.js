exports.mockOAuthLogin = (req, res) => {
  // Simulated OAuth authentication response
  res.json({
    msg: "Welcome to " + req.user.role + " AI Agent.",

    user: {
      email: req.user.email,
      role: req.user.role, // Role comes from JWT middleware
    },
  });
};
