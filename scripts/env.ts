import { config } from 'dotenv';

/** Les scripts en ligne de commande lisent la même configuration que Next. */
config({ path: '.env.local' });
config({ path: '.env' });
