import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Order } from '../../enterprise/entities/order';
import { OrdersRepository } from '../gateways/repositories/orders-repository';

export type GetCustomerOrdersRequest = PaginatedRequest<{
  customerId: string;
}>;

export type GetCustomerOrdersResponse = PaginatedResponse<Order>;

export class GetCustomerOrders
  implements UseCase<GetCustomerOrdersRequest, GetCustomerOrdersResponse>
{
  constructor(
    private readonly logger: Logger,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async execute(
    request: GetCustomerOrdersRequest,
  ): Promise<GetCustomerOrdersResponse> {
    try {
      this.logger.log(
        GetCustomerOrders.name,
        `Fetching orders for customer ${request.customerId} with params ${JSON.stringify(request, null, 2)}`,
      );

      const response = await this.ordersRepository.list({
        ...request,
        customerId: new UniqueEntityID(request.customerId),
      });

      this.logger.log(
        GetCustomerOrders.name,
        `Found ${response.total} order with ${JSON.stringify(request, null, 2)}`,
      );

      return response;
    } catch (error: any) {
      this.logger.error(
        GetCustomerOrders.name,
        `Error while fetching orders with ${JSON.stringify(request, null, 2)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
