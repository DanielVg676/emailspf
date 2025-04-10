import bodyParser from "body-parser";
import express from "express";
import emailRoutes from "./routes/emailRoute.js";
import { userEvents, paymentEvents, passwordChangeEvents  } from "./services/rabbitService.js";

const app = express();

app.use(bodyParser.json());
app.use('/api/email', emailRoutes)

userEvents().catch((err) => {
    console.log('Error iniciando ael consumido de eventos de usuarios:', err);
});

paymentEvents().catch((err) => {
    console.log('Error iniciando ael consumido de eventos de pagos:', err);
});

passwordChangeEvents().catch((err) => {
    console.log('Error iniciando ael consumido de eventos de cambio de contraseña:', err);
});


passwordChangeEventsConfirm().catch((err) => {
    console.log('Error iniciando ael consumido de eventos de cambio de contraseña:', err);
});


export default app;
