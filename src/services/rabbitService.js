import amqp from 'amqplib';
import dotenv from 'dotenv';
import transporter from '../config/emailConfig.js';

dotenv.config();

const RABBITMQ_URL = process.env.RABBIT_HOST;

//PARA PROYECTOS SUMAMENTE GRANDES DIVIDIR LA LOGICA QUE SE ENCUENTRA AQUI EN PARTES, ADEMAS DE USAR CORRECTAMENTE LAS PLANTILALS DE HBS ASDSA


// Función para enviar email de bienvenida al usuario registrado
async function sendEmail(user) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.username,
        subject: 'Bienvenido',
        html: `
            <div style="text-align: center; font-family: Arial, sans-serif; background-color: grey; color: black;">
                <p></p>
                <h1>Bienvenido!</h1>
                <h2>${user.username}</h2>
                <p>Gracias por registrarte en nuestro sistema</p>
                <p>Tu contraseña segura temporal es:</p>
                <p>${user.password}</p>
                <p></p>
                <p>Por favor cambia la contraseña</p>
                <p></p>
                <p></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de bienvenida enviado con éxito');
    } catch (error) {
        console.error('Error enviando el email de bienvenida:', error.message);
    }
}

// Función para enviar email de confirmación de pago
async function sendPaymentEmail(payment) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: payment.email,
        subject: payment.subject || 'Confirmación de Pago',
        html: `
            <div style="text-align: center; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333;">
                <p></p>
                <h1>¡Pago Exitoso!</h1>
                <h2>Hola, ${payment.email}</h2>
                <p>${payment.body || 'Tu pago ha sido procesado exitosamente.'}</p>
                <p>Gracias por tu compra.</p>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                <p></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de confirmación de pago enviado con éxito');
    } catch (error) {
        console.error('Error enviando el email de confirmación de pago:', error.message);
    }
}

// Consumidor para eventos de usuarios
export async function userEvents() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const exchange = 'user_event';
        const queue = 'user_created_queue';
        const routingKey = 'user.created';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        console.log(`Esperando mensajes en ${queue}`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const user = JSON.parse(msg.content.toString());
                console.log('Mensaje de usuario recibido:', user);
                await sendEmail(user);
                channel.ack(msg);
            }
        }, { noAck: false });

        connection.on('close', () => {
            console.error('Conexión cerrada en userEvents, intentando reconectar en 5s...');
            setTimeout(userEvents, 5000);
        });
    } catch (error) {
        console.log('Error al conectar con RabbitMQ en userEvents:', error.message);
        console.log('Reintentando en 5s...');
        setTimeout(userEvents, 5000);
    }
}

// Consumidor para eventos de pagos
export async function paymentEvents() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const exchange = 'payment_event';
        const queue = 'payment_created_queue';
        const routingKey = 'payment.created';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        console.log(`Esperando mensajes en ${queue}`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const payment = JSON.parse(msg.content.toString());
                console.log('Mensaje de pago recibido:', payment);
                await sendPaymentEmail(payment);
                channel.ack(msg);
            }
        }, { noAck: false });

        connection.on('close', () => {
            console.error('Conexión cerrada en paymentEvents, intentando reconectar en 5s...');
            setTimeout(paymentEvents, 5000);
        });
    } catch (error) {
        console.log('Error al conectar con RabbitMQ en paymentEvents:', error.message);
        console.log('Reintentando en 5s...');
        setTimeout(paymentEvents, 5000);
    }
}

async function sendPasswordChangeEmail(data) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: 'Cambio de Contraseña',
        html: `
        <p>Hola, ${data.email} has solicitado cambiar tu contraseña.</p>
        <p>Tu nueva contraseña es: ${data.newPassword}</strong></p>
        <a href="https://tu-frontend.com/confirmar-cambio?email={{email}}" 
        style="padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
        Confirmar cambio de contraseña
        </a>

        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de cambio de contraseña enviado con éxito');
    } catch (error) {
        console.error('Error enviando el email de cambio de contraseña:', error.message);
    }
}

// Consumidor para eventos de cambio de contraseña
export async function passwordChangeEvents() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const exchange = 'user_event';
        const queue = 'password_change_queue';
        const routingKey = 'user.password.changed';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        console.log(`Esperando mensajes en ${queue}`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                console.log('Mensaje de cambio de contraseña recibido:', data);
                await sendPasswordChangeEmail(data);
                channel.ack(msg);
            }
        }, { noAck: false });

        connection.on('close', () => {
            console.error('Conexión cerrada en passwordChangeEvents, intentando reconectar en 5s...');
            setTimeout(passwordChangeEvents, 5000);
        });
    } catch (error) {
        console.log('Error al conectar con RabbitMQ en passwordChangeEvents:', error.message);
        console.log('Reintentando en 5s...');
        setTimeout(passwordChangeEvents, 5000);
    }
}