export default `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f2f2f2;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #007BFF;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
            text-align: center;
        }
        .content h2 {
            font-size: 22px;
            margin-top: 0;
        }
        .content p {
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #007BFF;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 25px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 16px;
        }
        .footer {
            background-color: #f2f2f2;
            color: #666666;
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirmação de Conta</h1>
        </div>
        <div class="content">
            <h2>Olá, {{name}}! 👋</h2>
            <p>Clique no botão abaixo para confirmar sua conta:</p>
            <a href="{{confirmationUrl}}" class="button">Confirmar Conta</a>
        </div>
        <div class="footer">
            <p>Se você não solicitou este email, por favor ignore esta mensagem.</p>
        </div>
    </div>
</body>
</html>
`;
