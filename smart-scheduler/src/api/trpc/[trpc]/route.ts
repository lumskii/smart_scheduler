import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter }           from '@/server/trpc/router';
import { createContext }       from '@/server/trpc/context';

export const runtime = 'nodejs';           // use 'edge' if you prefer

const handler = (req: Request) =>
  fetchRequestHandler({ req, router: appRouter, endpoint: '/api/trpc', createContext });

export { handler as GET, handler as POST };
