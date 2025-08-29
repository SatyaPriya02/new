// // controllers/authController.js
// import Employee from "../models/Employee.js";
// import OTP from "../models/OTP.js";
// import jwt from "jsonwebtoken";
// import { generateOtp } from "../utils/otpGenerator.js";

// export async function loginByEmpId(req, res) {
//   try {
//     const { empId } = req.body;
//     if (!empId) return res.status(400).json({ message: "empId is required" });

//     const employee = await Employee.findOne({ empId });
//     if (!employee) {
//       // You can choose to auto-create on first login by empId if you want.
//       return res.status(404).json({ message: "Employee ID not found" });
//     }

//     // Frontend expects: { employee }
//     return res.json({ employee: {
//       _id: employee._id,
//       empId: employee.empId,
//       name: employee.name,
//       mobileNumber: employee.mobileNumber,
//       role: employee.role,
//       companyName: employee.companyName
//     }});
//   } catch (e) {
//     res.status(500).json({ message: "Server error" });
//   }
// }

// export async function sendOtp(req, res) {
//   try {
//     const { empId, mobileNumber } = req.body;
//     if (!empId || !mobileNumber) {
//       return res.status(400).json({ message: "empId and mobileNumber are required" });
//     }

//     const employee = await Employee.findOne({ empId });
//     if (!employee) return res.status(404).json({ message: "Employee not found" });

//     const code = generateOtp(6);

//     await OTP.create({ empId, mobileNumber, code });

//     // TODO: integrate SMS gateway. For demo, log to server.
//     console.log(`OTP for ${empId} (${mobileNumber}): ${code}`);

//     return res.json({ message: "OTP sent to mobile" });
//   } catch (e) {
//     res.status(500).json({ message: "Server error" });
//   }
// }

// export async function verifyOtp(req, res) {
//   try {
//     const { empId, mobileNumber, otpCode } = req.body;
//     if (!empId || !mobileNumber || !otpCode) {
//       return res.status(400).json({ message: "empId, mobileNumber and otpCode are required" });
//     }

//     const record = await OTP.findOne({ empId, mobileNumber }).sort({ createdAt: -1 });
//     if (!record) return res.status(400).json({ message: "OTP not found. Please request again" });

//     // 5-minute expiry is enforced by TTL index; still check:
//     if (Date.now() - record.createdAt.getTime() > 5 * 60 * 1000) {
//       return res.status(400).json({ message: "OTP expired. Request a new one" });
//     }

//     if (record.code !== otpCode) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // success — update employee mobile if empty or changed
//     const employee = await Employee.findOneAndUpdate(
//       { empId },
//       { mobileNumber },
//       { new: true }
//     );

//     // issue JWT
//     const token = jwt.sign(
//       { sub: employee._id, empId: employee.empId, role: employee.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "12h" }
//     );

//     // optional: delete used OTPs for cleanliness
//     await OTP.deleteMany({ empId });

//     return res.json({
//       token,
//       employee: {
//         _id: employee._id,
//         empId: employee.empId,
//         name: employee.name,
//         mobileNumber: employee.mobileNumber,
//         role: employee.role,
//         companyName: employee.companyName
//       }
//     });
//   } catch (e) {
//     res.status(500).json({ message: "Server error" });
//   }
// }





// controllers/authController.js
import Employee from "../models/Employee.js";
import EmailOTP from "../models/EmailOTP.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/email.js";

export async function loginWithPassword(req, res) {
  try {
    const { login, password } = req.body; // login = empId OR email
    if (!login || !password) return res.status(400).json({ message: "login and password are required" });

    const q = login.includes("@") ? { email: login } : { empId: login };
    const user = await Employee.findOne(q);
    if (!user?.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { sub: user._id, empId: user.empId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      employee: {
        _id: user._id,
        empId: user.empId,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { login } = req.body; // empId or email
    if (!login) return res.status(400).json({ message: "login is required" });

    const q = login.includes("@") ? { email: login } : { empId: login };
    const user = await Employee.findOne(q);
    if (!user?.email) return res.status(404).json({ message: "User/email not found" });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await EmailOTP.create({ email: user.email, code, purpose: "reset" });

    await sendMail({
      to: user.email,
      subject: "Your password reset code",
      text: `Your OTP is ${code}. It expires in 5 minutes.`,
      html: `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent to registered email" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { login, otp, newPassword } = req.body;
    if (!login || !otp || !newPassword) {
      return res.status(400).json({ message: "login, otp, newPassword are required" });
    }

    const q = login.includes("@") ? { email: login } : { empId: login };
    const user = await Employee.findOne(q);
    if (!user?.email) return res.status(404).json({ message: "User/email not found" });

    const latest = await EmailOTP.findOne({ email: user.email, purpose: "reset" }).sort({ createdAt: -1 });
    if (!latest) return res.status(400).json({ message: "OTP not found or expired" });
    if (latest.code !== otp) return res.status(400).json({ message: "Invalid OTP" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    await EmailOTP.deleteMany({ email: user.email, purpose: "reset" });

    res.json({ message: "Password updated. You can login now." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

