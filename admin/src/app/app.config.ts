import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { provideIcons } from '@ng-icons/core';
import {
  heroArrowDownRight,
  heroArrowLeftOnRectangle,
  heroArrowUpRight,
  heroBell,
  heroBuildingOffice2,
  heroCalendarDays,
  heroChatBubbleLeftRight,
  heroChevronDown,
  heroChevronRight,
  heroEnvelope,
  heroEye,
  heroEyeSlash,
  heroLockClosed,
  heroMagnifyingGlass,
  heroMapPin,
  heroMegaphone,
  heroNewspaper,
  heroPencilSquare,
  heroPlus,
  heroShieldCheck,
  heroSquares2x2,
  heroTrash,
  heroUsers,
} from '@ng-icons/heroicons/outline';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideAuthInitializer } from './core/services/auth.initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAuthInitializer(),
    provideHotToastConfig({ position: 'bottom-right', duration: 5000, dismissible: true }),
    provideIcons({
      heroArrowDownRight,
      heroArrowLeftOnRectangle,
      heroArrowUpRight,
      heroBell,
      heroBuildingOffice2,
      heroCalendarDays,
      heroChatBubbleLeftRight,
      heroChevronDown,
      heroChevronRight,
      heroEnvelope,
      heroEye,
      heroEyeSlash,
      heroLockClosed,
      heroMagnifyingGlass,
      heroMapPin,
      heroMegaphone,
      heroNewspaper,
      heroPencilSquare,
      heroPlus,
      heroShieldCheck,
      heroSquares2x2,
      heroTrash,
      heroUsers,
    }),
  ],
};
