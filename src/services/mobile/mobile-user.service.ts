import type { Context } from "hono";
import mobileUserModel from "../../models/mobile/mobile-user.js";
import { mobileUser } from "../../models/mobile/mobile-user.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import { transporter } from "./mail-sender.service.js";
import { tempUserModel } from "../../models/mobile/temp-user.js";
export const mobileUserController = {
  // register: async (c: Context) => {
  //   try {
  //     const salt = await bcrpyt.genSalt();
  //     const formData = await c.req.formData();
  //     const file = formData.get("profile") as File;
  //     const buffer = await file.arrayBuffer();
  //     const password = formData.get("password");
  //     const hashPass = await bcrpyt.hash(password as string, salt);
  //     const body = {
  //       name: formData.get("name") as string,
  //       email: formData.get("email") as string,
  //       profile: {
  //         filename: file.name,
  //         mimetype: file.type,
  //         data: Buffer.from(buffer),
  //         length: file.size,
  //       },
  //       password: hashPass,
  //     };
  //     const validated = mobileUser.parse(body);
  //     const user = new mobileUserModel(validated);
  //     await user.save();
  //     return c.json({
  //       msg: "User created successfully!",
  //     });
  //   } catch (e) {
  //     if (e instanceof z.ZodError) {
  //       return c.json(e, 400);
  //     }
  //     return c.json({ error: e }, 500);
  //   }
  // },
  requestRegister: async (c: Context) => {
    try {
      const { email, password, name, phone } = await c.req.json();
      const salt = await bcrpyt.genSalt();
      const hashPass = await bcrpyt.hash(password, salt);

      const code = Math.floor(100000 + Math.random() * 900000);
      const expire = Date.now() + 1000 * 60 * 5; // 5 mins

      await tempUserModel.findOneAndUpdate(
        { email },
        {
          email,
          password: hashPass,
          name,
          phone,
          code,
          expire,
          resendCount: 0,
        },
        { upsert: true } // use this when can't find any so that it will create a new one
      );

      await transporter.sendMail({
        to: email,
        subject: "Verification Code",
        text: `Your verification code is ${code}`,
      });
      return c.json({ msg: "Code sent. Check your email." });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  verifyRegister: async (c: Context) => {
    const { email, code } = await c.req.json();

    const temp = await tempUserModel.findOne({ email });
    if (!temp) return c.json({ msg: "No registration request" }, 400);

    if (temp.code != code) return c.json({ msg: "Invalid code" }, 400);

    if (Date.now() > temp.expire) return c.json({ msg: "Code expired" }, 400);

    await mobileUserModel.create({
      email: temp.email,
      password: temp.password,
      phone: temp.phone,
      name: temp.name,
    });

    await tempUserModel.deleteOne({ email });

    return c.json({ msg: "Account created successfully!" });
  },
  resendCode: async (c: Context) => {
    const { email } = await c.req.json();

    const temp = await tempUserModel.findOne({ email });
    if (!temp) return c.json({ msg: "No pending registration" }, 400);

    if (temp.resendCount >= 3)
      return c.json({ msg: "Resend limit reached" }, 429);

    const newCode = Math.floor(100000 + Math.random() * 900000);
    const expire = Date.now() + 1000 * 60 * 5;

    temp.code = newCode;
    temp.expire = expire;
    temp.resendCount += 1;
    await temp.save();

    await transporter.sendMail({
      to: email,
      subject: "New Verification Code",
      text: `Your new verification code is ${newCode}`,
    });

    return c.json({ msg: "New code sent" });
  },
  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await mobileUserModel.findOne({ email });
      const userBody = {
        name: user?.name,
        email: user?.email,
      };
      if (!user) c.json({ message: "Unauthenticated" }, 401);
      const compare = await bcrpyt.compare(password, user!.password);
      if (!compare) c.json({ message: "Wrong Password" }, 401);
      const token = getToken();
      const expireAt = getExpirationDate(token);
      return c.json({
        user: userBody,
        token: token,
        expireAt: expireAt,
        message: "Login Success",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUsers: async (c: Context) => {
    try {
      const users = await mobileUserModel.find();
      return c.json({
        list: users,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const user = await mobileUserModel.findById(id).select("-password");
      return c.json(user);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUserProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const profile = await mobileUserModel.findById(id).select("profile");
      if (profile) {
        return c.body(profile!.profile.data, 200, {
          "Content-Type": profile!.profile.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  updateProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData();
      const file = formData.get("profile") as File;

      const body: any = {};

      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.profile = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }

      if (!body.profile) {
        return c.json({ msg: "Please input file" }, 400);
      }

      // Only validate profile part
      const profileSchema = mobileUser.pick({ profile: true });
      const validated = profileSchema.parse(body);

      await mobileUserModel.findByIdAndUpdate(id, validated);

      return c.json({ msg: "User updated successfully!" });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },

  updateAccount: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const salt = await bcrpyt.genSalt();
      const { name, email, password, phone, address } = await c.req.json();
      const body: any = {};
      if (name) body.name = name;
      if (email) body.email = email;
      if (password) {
        const hashPass = await bcrpyt.hash(password as string, salt);
        body.password = hashPass;
      }
      if (phone) body.phone = phone;
      if (address) {
        body.address = address;
      }
      // const validated = mobileUser.parse(body);
      const updated = await mobileUserModel
        .findByIdAndUpdate(id, body)
        .select("-profile.data");
      return c.json({
        msg: "User updated successfully!",
        data: updated,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await mobileUserModel.findByIdAndDelete(id);
      return c.json({
        msg: "User deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
function getToken() {
  const secret = process.env.JWT_KEY;
  if (!secret) {
    throw new Error("JWT_KEY is not defined in environment variables.");
  }
  return jwt.sign({}, secret, {
    expiresIn: "24h",
  });
}
function getExpirationDate(token: string): Date | null {
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded?.exp) return null;

  // Convert Unix timestamp to JavaScript Date
  return new Date(decoded.exp * 1000);
}
