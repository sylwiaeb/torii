import loadInitializer from 'torii/lib/load-initializer';
import loadInstanceInitializer from 'torii/lib/load-instance-initializer';
import initializeTorii from 'torii/initializers/initialize-torii';
import initializeToriiSession from 'torii/initializers/initialize-torii-session';
import setupRoutes from 'torii/instance-initializers/setup-routes';
import walkProviders from 'torii/instance-initializers/walk-providers';

export default function(){
  loadInitializer(initializeTorii);
  loadInitializer(initializeToriiSession);
  loadInstanceInitializer(walkProviders);
  loadInstanceInitializer(setupRoutes);
}
