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
        <div style="
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #444; 
            max-width: 600px; 
            margin: 0 auto; 
            border: 1px solid #ddd; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden;">
            <header style="
                background-color: #3498db; 
                padding: 20px; 
                text-align: center;">
                <h1 style="color: white; font-size: 24px; margin: 0;">Cambio de Contraseña</h1>
            </header>
            <div style="padding: 20px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hola <strong>${data.email}</strong>,
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Has solicitado cambiar tu contraseña. A continuación, encontrarás tu nueva contraseña:
                </p>
                <p style="
                    font-size: 18px; 
                    font-weight: bold; 
                    text-align: center; 
                    background-color: #f8f9fa; 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    border-radius: 5px; 
                    margin-bottom: 20px;">
                    ${data.newPassword}
                </p>
                <p style="font-size: 14px; color: #777; margin-top: 20px; text-align: center;">
                    Si no solicitaste este cambio, ignora este correo.
                </p>
            </div>
            <footer style="
                background-color: #f8f9fa; 
                text-align: center; 
                padding: 10px; 
                font-size: 12px; 
                color: #aaa;">
                &copy; 2025 Tu Empresa. Todos los derechos reservados.
            </footer>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de cambio de contraseña enviado con éxito');
    } catch (error) {
        console.error('Error enviando el email de cambio de contraseña:', error.message);
    }
}

// Consumidor para eventos de cambio de contraseña ya confirmados
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

async function sendPasswordConfirm(data) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: 'Cambio de Contraseña',
        html: `
        <div style="
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #444; 
            max-width: 600px; 
            margin: 0 auto; 
            border: 1px solid #ddd; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden;">
            <header style="
                background-color: #3498db; 
                padding: 20px; 
                text-align: center;">
                <h1 style="color: white; font-size: 24px; margin: 0;">Cambio de Contraseña</h1>
            </header>
            <div style="padding: 20px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hola <strong>${data.email}</strong>,
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Has solicitado cambiar tu contraseña. A continuación, confirma el cambio de tu contraseña:
                <p style="text-align: center;">
                    <a href="https://userspf-production.up.railway.app/users/change-password/${data.email}" 
                       style="
                       display: inline-block; 
                       padding: 15px 30px; 
                       background-color: #3498db; 
                       color: white; 
                       text-decoration: none; 
                       border-radius: 5px; 
                       font-size: 16px; 
                       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                        Confirmar cambio de contraseña
                    </a>
                </p>
                <p style="font-size: 14px; color: #777; margin-top: 20px; text-align: center;">
                    Si no solicitaste este cambio, ignora este correo.
                </p>
            </div>
            <footer style="
                background-color: #f8f9fa; 
                text-align: center; 
                padding: 10px; 
                font-size: 12px; 
                color: #aaa;">
                &copy; 2025 Tu Empresa. Todos los derechos reservados.
            </footer>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de cambio de contraseña enviado con éxito');
    } catch (error) {
        console.error('Error enviando el email de cambio de contraseña:', error.message);
    }
}


// Consumidor para eventos de cambio de contraseña sin confirmar
export async function passwordChangeEventsConfirm() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const exchange = 'users_event';
        const queue = 'passwords_change_queue';
        const routingKey = 'user.passwords.changed';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        console.log(`Esperando mensajes en ${queue}`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                console.log('Mensaje de cambio de contraseña recibido:', data);
                await sendPasswordConfirm(data);
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
