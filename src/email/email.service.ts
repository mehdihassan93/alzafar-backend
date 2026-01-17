import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOrderConfirmation(email: string, orderDetails: any) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order Confirmation - #${orderDetails.orderId}`,
      template: './order-confirmation',
      context: {
        name: orderDetails.customerName,
        orderId: orderDetails.orderId,
        total: orderDetails.totalAmount,
        items: orderDetails.items,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Al-Zafar Shopping!',
      template: './welcome',
      context: {
        name,
      },
    });
  }

  async sendOrderStatusUpdate(
    email: string,
    orderId: string,
    status: string,
    name: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order Update - #${orderId}`,
      template: './order-status',
      context: {
        name,
        orderId,
        status,
      },
    });
  }

  async sendPriceDropEmail(
    email: string,
    name: string,
    productName: string,
    newPrice: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Price Drop Alert! - ${productName}`,
      template: './price-drop',
      context: {
        name,
        productName,
        newPrice,
      },
    });
  }

  async sendLowStockAlert(
    adminEmail: string,
    productName: string,
    stock: number,
  ) {
    await this.mailerService.sendMail({
      to: adminEmail,
      subject: `⚠️ Low Stock Alert: ${productName}`,
      template: './low-stock',
      context: {
        productName,
        stock,
      },
    });
  }
}
