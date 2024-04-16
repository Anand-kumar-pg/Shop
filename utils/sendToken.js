// Create token and save in the cookie

export default (user, statusCode, res) => {

    // Create JWT Token
    const token = user.getJwtToken()

    // Options for cookie
    const options = {
        sameSite: 'none', // Allow cross-site requests
            secure: true, // Only send cookie over HTTPS
            maxAge: 100 * 60 * 1000 // Expiry time in milliseconds (100 minutes)
    };

    res.cookie("token", token, options).status(statusCode).json({
        token,
    });
};