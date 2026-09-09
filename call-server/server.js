const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = new WebSocket.Server({
    host: "0.0.0.0",
    port: PORT
});

const clients = new Map();

console.log(`Сервер звонков запущен на порту ${PORT}`);

server.on("connection", (ws) => {
    let userId = null;

    console.log("Новое подключение");

    ws.on("message", (message) => {
        let data;

        try {
            data = JSON.parse(message.toString());
        } catch {
            return;
        }

        // Регистрация пользователя
        if (data.type === "register") {
            userId = data.userId;

            if (!userId) {
                return;
            }

            // Если пользователь уже был подключен,
            // закрываем старое соединение
            if (clients.has(userId)) {
                const oldClient = clients.get(userId);

                if (oldClient.readyState === WebSocket.OPEN) {
                    oldClient.close();
                }
            }

            clients.set(userId, ws);

            console.log(`Пользователь подключился: ${userId}`);

            ws.send(JSON.stringify({
                type: "registered",
                userId
            }));

            return;
        }

        // Передача сообщения нужному пользователю
        if (data.to && clients.has(data.to)) {
            const target = clients.get(data.to);

            if (target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                    ...data,
                    from: userId
                }));
            }
        }
    });

    // Пользователь отключился
    ws.on("close", () => {
        if (userId) {
            clients.delete(userId);
            console.log(`Пользователь отключился: ${userId}`);
        }
    });

    // Ошибка WebSocket
    ws.on("error", (error) => {
        console.log("Ошибка WebSocket:", error.message);
    });
});
