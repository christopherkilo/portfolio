import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { credentialsInterceptor } from "./core/api/credentials.interceptor";
import { authErrorInterceptor } from "./core/api/auth-error.interceptor";
import { AuthService } from "./core/auth/auth";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, authErrorInterceptor]),
    ),
    provideRouter(routes),
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
};
