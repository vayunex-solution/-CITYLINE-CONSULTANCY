/**
 * CITYLINE CONSULTANCY — cPanel Phusion Passenger Application Entry Point
 * 
 * This file acts as the startup wrapper for cPanel's "Setup Node.js App".
 * It routes passenger execution directly to the compiled production engine.
 */

require('./dist/server.js');
