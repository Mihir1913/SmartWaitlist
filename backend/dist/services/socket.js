let io = null;
export function setIO(server) {
    io = server;
}
export function emitToRestaurant(restaurantId, event, data) {
    io?.to(`restaurant:${restaurantId}`).emit(event, data);
}
export function emitRestaurantSync(restaurantId, state) {
    io?.to(`restaurant:${restaurantId}`).emit('restaurant:sync', { state });
}
export function getIO() {
    return io;
}
