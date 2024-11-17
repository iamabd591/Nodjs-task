const crypto = require("crypto");
const otpCache = new Map();

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const saveOtpWithRegeneration = (email) => {
  const otp = generateOtp();
  const expiry = Date.now() + 60000;

  otpCache.set(email, { otp, expiry });

  console.log(`Generated OTP for ${email}: ${otp}`);

  const otpInterval = setInterval(() => {
    const otpData = otpCache.get(email);

    if (!otpData) {
      clearInterval(otpInterval);
      return;
    }

    if (Date.now() >= otpData.expiry) {
      const newOtp = generateOtp();
      otpCache.set(email, { otp: newOtp, expiry: Date.now() + 60000 });
      console.log(`New OTP for ${email}: ${newOtp}`);
    }
  }, 5000);
};

module.exports = {
  saveOtpWithRegeneration,
  otpCache,
};
