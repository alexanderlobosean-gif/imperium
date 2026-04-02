const nodemailer = require('nodemailer');

// Configuração do transporter de email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Enviar email com código de verificação para transferência
 * @param {string} to - Email do destinatário
 * @param {string} code - Código de 6 dígitos
 * @param {Object} transferDetails - Detalhes da transferência
 */
const sendTransferVerificationEmail = async (to, code, transferDetails) => {
  try {
    const transporter = createTransporter();
    
    const { amount, recipientEmail } = transferDetails;
    
    const mailOptions = {
      from: `"Imperium Club" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Código de Verificação - Transferência',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
            <h1 style="margin: 0; color: #d4af37;">Imperium Club</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.8;">Verificação de Transferência</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333;">Olá,</p>
            
            <p style="font-size: 16px; color: #333;">
              Você solicitou uma transferência de <strong style="color: #d4af37;">R$ ${parseFloat(amount).toFixed(2)}</strong> 
              para <strong>${recipientEmail}</strong>.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Seu código de verificação:</p>
              <h2 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #1a1a2e; font-weight: bold;">${code}</h2>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Código válido por 10 minutos</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Digite este código na tela de transferência para confirmar a transação.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Se você não solicitou esta transferência, ignore este email ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificação enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gerar código de verificação de 6 dígitos
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendTransferVerificationEmail,
  generateVerificationCode
};
