import { PaginatedResponse } from '@/core/types/pagination';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { GetCustomerOrders } from '@/domain/showcase/application/use-cases/get-customer-orders';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  OrderHTTPResponse,
  OrderPresenter,
} from './presenters/order-presenter';

const GetCustomerOrdersParamsSchema = z.object({
  limit: z
    .number({
      coerce: true,
    })
    .default(10),
  page: z
    .number({
      coerce: true,
    })
    .default(1),
});

export type GetCustomerOrdersParams = z.infer<
  typeof GetCustomerOrdersParamsSchema
>;

export type GetCustomerOrdersResponse = PaginatedResponse<OrderHTTPResponse>;

@Controller('/orders')
export class GetCustomerOrdersController {
  constructor(
    private readonly getCustomerOrders: GetCustomerOrders,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.USER)
  @Get()
  async handle(
    @Query(new ZodValidationPipe(GetCustomerOrdersParamsSchema))
    query: GetCustomerOrdersParams,
    @CurrentUser()
    user: User,
  ): Promise<GetCustomerOrdersResponse> {
    try {
      this.logger.log(
        GetCustomerOrdersController.name,
        `listing orders with: ${JSON.stringify(query)}`,
      );

      const result = await this.getCustomerOrders.execute({
        ...query,
        customerId: user.id.toString(),
      });

      this.logger.log(
        GetCustomerOrdersController.name,
        `found ${result.total} orders with ${JSON.stringify(query, null, 2)}.`,
      );

      return {
        ...result,
        items: result.items.map(OrderPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        GetCustomerOrdersController.name,
        `Error on listing orders with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
