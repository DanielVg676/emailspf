//import { text } from "body-parser";
import transporter from "../config/emailConfig.js";
import dotenv from 'dotenv';


dotenv.config();
export const sendEmail = async (req, res) => {
    const { to } = req.body;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject: "Bienvenido",
            template: "bienvenida",
            context: { to }
        });

        res.json({ message: "Correo enviado con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
