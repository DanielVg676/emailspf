import nodemailer from "nodemailer";
import { create } from "express-handlebars";
import nodemailerExpressHandlebars from "nodemailer-express-handlebars";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Configurar Handlebars
const hbsOptions = {
    viewEngine: create({
        extname: ".hbs",
        defaultLayout: false,
    }),
    viewPath: path.resolve("../email/src/views/email"),
    extName: ".hbs",
};

transporter.use("compile", nodemailerExpressHandlebars(hbsOptions));

export default transporter;
