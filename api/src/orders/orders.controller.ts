import {
  Controller, Get, Post, Param, Query, Body, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminGuard } from '../auth/auth.guard';

@Controller('api')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Public
  @Post('orders')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('orders/:id/download')
  download(@Param('id') id: string, @Query('token') token: string) {
    return this.ordersService.getDownloadUrls(id, token);
  }

  @Get('orders/:id/download-zip')
  async downloadZip(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    return this.ordersService.streamZip(id, token, res);
  }

  @Get('orders/:id/receipt')
  async receipt(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const pdf = await this.ordersService.getReceipt(id, token);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="trailshot-recu-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  }

  // Admin
  @UseGuards(AdminGuard)
  @Get('admin/orders')
  findAll() {
    return this.ordersService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('admin/orders/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @UseGuards(AdminGuard)
  @Post('admin/orders/:id/resend')
  resend(@Param('id') id: string) {
    return this.ordersService.resendDownloadEmail(id);
  }

  @UseGuards(AdminGuard)
  @Get('admin/events/:eventId/orders')
  findByEvent(@Param('eventId') eventId: string) {
    return this.ordersService.findByEvent(eventId);
  }
}
