import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setIO(server: SocketServer) {
  io = server;
}

export function emitToRestaurant(restaurantId: string, event: string, data: unknown) {
  io?.to(`restaurant:${restaurantId}`).emit(event, data);
}

export function getIO() {
  return io;
}
