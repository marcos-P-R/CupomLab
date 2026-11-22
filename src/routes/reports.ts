import { FastifyPluginAsync } from 'fastify';
import { rankStoresByCoupons } from '../services/rankStoresByCoupons';

interface QueryParams {
  discount?: string;
  startDate?: string;
  endDate?: string;
  order?: string;
}

const reportsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: QueryParams }>(
    '/reports/coupons/by-store',
    async (request, reply) => {
      const { discount, startDate, endDate, order } = request.query;

      if (!discount || !startDate || !endDate) {
        return reply.status(400).send({
          error: 'Parâmetros obrigatórios ausentes: discount, startDate e endDate.',
        });
      }

      const discountNumber = Number(discount);
      if (!Number.isInteger(discountNumber)) {
        return reply.status(400).send({
          error: 'O parâmetro discount deve ser um número inteiro.',
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return reply.status(400).send({
          error: 'Os parâmetros startDate e endDate devem ser datas ISO 8601 válidas.',
        });
      }

      if (end <= start) {
        return reply.status(400).send({
          error: 'O parâmetro endDate deve ser posterior a startDate.',
        });
      }

      const orderValue = order ?? 'desc';
      if (orderValue !== 'asc' && orderValue !== 'desc') {
        return reply.status(400).send({
          error: "O parâmetro order deve ser 'asc' ou 'desc'.",
        });
      }

      const result = await rankStoresByCoupons({
        discount: discountNumber,
        startDate: start,
        endDate: end,
        order: orderValue,
      });

      return reply.status(200).send(result);
    },
  );
};

export default reportsRoute;
