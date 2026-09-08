import { AltchaCaptchaSolver, CaptchaSolver, Challenge } from '@core/captcha/captcha-solver'
import { AppConfig } from '@core/config/env'
import { HttpClient } from '@core/http/http-client'
import { SessionBridge } from '@core/http/session-bridge'
import { logger } from '@core/logger/logger'
import { ExpoSecretStore } from '@core/storage/secure-store.adapter'
import { SecretStore } from '@core/storage/ports'
import { HttpCatalogRepository } from '@features/catalog/data/repositories/http-catalog.repository'
import { AsyncCartStorage } from '@features/cart/data/repositories/async-cart.storage'
import { HttpCartMerger } from '@features/cart/data/repositories/http-cart-merger'
import { HttpCartStorage } from '@features/cart/data/repositories/http-cart.storage'
import { SessionAwareCartStorage } from '@features/cart/data/repositories/session-aware-cart.storage'
import { MergeGuestLines } from '@features/cart/domain/usecases/merge-guest-lines'
import { HttpQuoteRepository } from '@features/cart/data/repositories/http-quote.repository'
import { HttpSavedCartRepository } from '@features/cart/data/repositories/http-saved-cart.repository'
import { AddToCart } from '@features/cart/domain/usecases/add-to-cart'
import { ClearCart } from '@features/cart/domain/usecases/clear-cart'
import { LoadCart } from '@features/cart/domain/usecases/load-cart'
import { LoadSavedCart } from '@features/cart/domain/usecases/load-saved-cart'
import { MergeGuestCart } from '@features/cart/domain/usecases/merge-guest-cart'
import { MoveToCart } from '@features/cart/domain/usecases/move-to-cart'
import { QuoteCart } from '@features/cart/domain/usecases/quote-cart'
import { RemoveFromCart } from '@features/cart/domain/usecases/remove-from-cart'
import { SaveForLater } from '@features/cart/domain/usecases/save-for-later'
import { UpdateQuantity } from '@features/cart/domain/usecases/update-quantity'
import { AsyncPreferenceStore } from '@core/storage/async-storage.adapter'
import { HttpRegionRepository } from '@features/account/data/repositories/http-region.repository'
import { RegionRepository } from '@features/account/domain/ports/region-repository'
import { HttpAccountRepository } from '@features/account/data/repositories/http-account.repository'
import { AccountRepository } from '@features/account/domain/ports/account-repository'
import { ChangePassword } from '@features/account/domain/usecases/change-password'
import {
  ConfirmAccountDeletion,
  RequestAccountDeletion,
} from '@features/account/domain/usecases/delete-account'
import { ListCurrencies, ListLanguages } from '@features/account/domain/usecases/list-region-options'
import { ListSessions, RevokeSession } from '@features/account/domain/usecases/sessions'
import { HttpSubscriptionRepository } from '@features/account/data/repositories/http-subscription.repository'
import { SubscriptionRepository } from '@features/account/domain/ports/subscription-repository'
import {
  CancelSubscription,
  GetSubscription,
} from '@features/account/domain/usecases/subscription'
import { LoadPreferences, SavePreferences } from '@features/account/domain/usecases/preferences'
import { ExpoPaymentApprovalGateway } from '@features/checkout/data/repositories/expo-payment-approval.gateway'
import { HttpAddressRepository } from '@features/checkout/data/repositories/http-address.repository'
import { HttpBillingRepository } from '@features/checkout/data/repositories/http-billing.repository'
import { HttpCheckoutRepository } from '@features/checkout/data/repositories/http-checkout.repository'
import { HttpPaymentIntentRepository } from '@features/checkout/data/repositories/http-payment-intent.repository'
import { HttpPaymentMethodsRepository } from '@features/checkout/data/repositories/http-payment-methods.repository'
import { HttpShippingRepository } from '@features/checkout/data/repositories/http-shipping.repository'
import { HttpNotificationsRepository } from '@features/notifications/data/repositories/http-notifications.repository'
import { NotificationsRepository } from '@features/notifications/domain/ports/notifications-repository'
import {
  ArchiveNotification,
  ListNotifications,
  MarkAllNotificationsRead,
  MarkNotificationRead,
} from '@features/notifications/domain/usecases/notifications'
import { HttpWalletRepository } from '@features/checkout/data/repositories/http-wallet.repository'
import { WalletRepository } from '@features/checkout/domain/ports/wallet-repository'
import { StripeCardAuthenticator } from '@features/checkout/data/repositories/stripe-card-authenticator'
import { StripeCardSetupGateway } from '@features/checkout/data/repositories/stripe-card-setup.gateway'
import { AddCard } from '@features/checkout/domain/usecases/add-card'
import { CreateAddress } from '@features/checkout/domain/usecases/create-address'
import { GetBillingConfig } from '@features/checkout/domain/usecases/get-billing-config'
import { GetWalletBalance } from '@features/checkout/domain/usecases/get-wallet-balance'
import { ListWalletTransactions } from '@features/checkout/domain/usecases/list-wallet-transactions'
import { ListAddresses } from '@features/checkout/domain/usecases/list-addresses'
import { ListPaymentMethods } from '@features/checkout/domain/usecases/list-payment-methods'
import { ListRegions } from '@features/checkout/domain/usecases/list-regions'
import { PayWithProvider } from '@features/checkout/domain/usecases/pay-with-provider'
import { PayWithSavedCard } from '@features/checkout/domain/usecases/pay-with-saved-card'
import { PlaceOrder } from '@features/checkout/domain/usecases/place-order'
import { QuoteShipping } from '@features/checkout/domain/usecases/quote-shipping'
import { HttpOrdersRepository } from '@features/orders/data/repositories/http-orders.repository'
import { OrdersRepository } from '@features/orders/domain/ports/orders-repository'
import { CancelOrder } from '@features/orders/domain/usecases/cancel-order'
import { GetOrderDetail } from '@features/orders/domain/usecases/get-order-detail'
import { GetOrderTracking } from '@features/orders/domain/usecases/get-order-tracking'
import { ListOrders } from '@features/orders/domain/usecases/list-orders'
import { HttpFavoritesRepository } from '@features/favorites/data/repositories/http-favorites.repository'
import { FavoritesRepository } from '@features/favorites/domain/ports/favorites-repository'
import { ListFavoriteIds } from '@features/favorites/domain/usecases/list-favorite-ids'
import { ListFavorites } from '@features/favorites/domain/usecases/list-favorites'
import { ToggleFavorite } from '@features/favorites/domain/usecases/toggle-favorite'
import { CatalogRepository } from '@features/catalog/domain/ports/catalog-repository'
import { BrowseProducts } from '@features/catalog/domain/usecases/browse-products'
import { GetProductDetail } from '@features/catalog/domain/usecases/get-product-detail'
import { ListCategories } from '@features/catalog/domain/usecases/list-categories'
import { ListRelatedProducts } from '@features/catalog/domain/usecases/list-related-products'
import { ListReviews } from '@features/catalog/domain/usecases/list-reviews'
import { LoadHome } from '@features/catalog/domain/usecases/load-home'
import { HttpAuthRepository } from '@features/auth/data/repositories/http-auth.repository'
import { SecureSessionStorage } from '@features/auth/data/repositories/secure-session.storage'
import { AuthRepository } from '@features/auth/domain/ports/auth-repository'
import { SessionStorage } from '@features/auth/domain/ports/session-storage'
import { ActivateAccount } from '@features/auth/domain/usecases/activate-account'
import { ConfirmPasswordReset } from '@features/auth/domain/usecases/confirm-password-reset'
import { Register } from '@features/auth/domain/usecases/register'
import { RequestPasswordReset } from '@features/auth/domain/usecases/request-password-reset'
import { ResendActivation } from '@features/auth/domain/usecases/resend-activation'
import { RestoreSession } from '@features/auth/domain/usecases/restore-session'
import { SignIn } from '@features/auth/domain/usecases/sign-in'
import { SignOut } from '@features/auth/domain/usecases/sign-out'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

export interface Container {
  readonly http: HttpClient
  readonly authRepository: AuthRepository
  readonly sessionStorage: SessionStorage
  readonly signIn: SignIn
  readonly signOut: SignOut
  readonly restoreSession: RestoreSession
  readonly register: Register
  readonly activateAccount: ActivateAccount
  readonly resendActivation: ResendActivation
  readonly requestPasswordReset: RequestPasswordReset
  readonly confirmPasswordReset: ConfirmPasswordReset
  readonly browseProducts: BrowseProducts
  readonly loadHome: LoadHome
  readonly listCategories: ListCategories
  readonly toggleFavorite: ToggleFavorite
  readonly listFavoriteIds: ListFavoriteIds
  readonly listFavorites: ListFavorites
  readonly listLanguages: ListLanguages
  readonly listCurrencies: ListCurrencies
  readonly loadPreferences: LoadPreferences
  readonly savePreferences: SavePreferences
  readonly getProductDetail: GetProductDetail
  readonly listReviews: ListReviews
  readonly listRelatedProducts: ListRelatedProducts
  readonly loadCart: LoadCart
  readonly loadSavedCart: LoadSavedCart
  readonly addToCart: AddToCart
  readonly updateQuantity: UpdateQuantity
  readonly removeFromCart: RemoveFromCart
  readonly clearCart: ClearCart
  readonly quoteCart: QuoteCart
  readonly saveForLater: SaveForLater
  readonly moveToCart: MoveToCart
  readonly mergeGuestCart: MergeGuestCart
  readonly mergeGuestLines: MergeGuestLines
  /** Expuesto para poder fundir la cesta del invitado justo al iniciar sesión. */
  readonly cartStorage: SessionAwareCartStorage
  readonly listOrders: ListOrders
  readonly getOrderDetail: GetOrderDetail
  readonly getOrderTracking: GetOrderTracking
  readonly cancelOrder: CancelOrder
  readonly listAddresses: ListAddresses
  readonly createAddress: CreateAddress
  readonly listRegions: ListRegions
  readonly quoteShipping: QuoteShipping
  readonly placeOrder: PlaceOrder
  readonly getWalletBalance: GetWalletBalance
  readonly listWalletTransactions: ListWalletTransactions
  readonly changePassword: ChangePassword
  readonly listSessions: ListSessions
  readonly revokeSession: RevokeSession
  readonly requestAccountDeletion: RequestAccountDeletion
  readonly confirmAccountDeletion: ConfirmAccountDeletion
  readonly getSubscription: GetSubscription
  readonly cancelSubscription: CancelSubscription
  readonly listNotifications: ListNotifications
  readonly markNotificationRead: MarkNotificationRead
  readonly markAllNotificationsRead: MarkAllNotificationsRead
  readonly archiveNotification: ArchiveNotification
  readonly listPaymentMethods: ListPaymentMethods
  readonly payWithSavedCard: PayWithSavedCard
  readonly payWithProvider: PayWithProvider
  readonly getBillingConfig: GetBillingConfig
  readonly addCard: AddCard
}

/**
 * Conecta el estado de sesión con el cliente HTTP.
 *
 * Los captadores leen del almacén de Zustand de forma síncrona, que es lo que el interceptor
 * necesita. Cuando el backend entrega tokens nuevos hay que guardarlos también en el almacén
 * cifrado, y eso es asíncrono: se lanza sin esperar porque el interceptor no puede bloquearse. Si
 * esa escritura fallara, la sesión seguiría viva en memoria y solo se perdería al cerrar la app.
 */
function buildSessionBridge(sessionStorage: SessionStorage): SessionBridge {
  return {
    getAccessToken: () => useSessionStore.getState().accessToken,
    getRefreshToken: () => useSessionStore.getState().refreshToken,
    getCountry: () => useSessionStore.getState().user?.country ?? null,
    getLocale: () => useSessionStore.getState().locale,
    getCurrency: () => useSessionStore.getState().currency,
    onRefreshed: (accessToken, refreshToken) => {
      useSessionStore.getState().setTokens(accessToken, refreshToken)
      sessionStorage
        .save({ accessToken, refreshToken })
        .catch((error: unknown) => logger.warn('No se pudieron persistir los tokens renovados', error))
    },
    onExpired: () => {
      useSessionStore.getState().anonymous()
      sessionStorage
        .clear()
        .catch((error: unknown) => logger.warn('No se pudo limpiar la sesión caducada', error))
    },
  }
}

interface Overrides {
  secrets?: SecretStore
  captcha?: CaptchaSolver
}

/**
 * Construye el grafo de dependencias a mano. No se usa ninguna librería de inyección: en una
 * aplicación de este tamaño solo añadiría indirección y arranque más lento.
 *
 * `overrides` existe para las pruebas, que sustituyen el almacén cifrado o el CAPTCHA sin tocar
 * nada más del cableado.
 */
export function buildContainer(config: AppConfig, overrides: Overrides = {}): Container {
  const secrets: SecretStore = overrides.secrets ?? new ExpoSecretStore()
  const sessionStorage: SessionStorage = new SecureSessionStorage(secrets)
  const http = new HttpClient(config.apiBaseUrl, buildSessionBridge(sessionStorage))
  // El solucionador pide su reto por el mismo cliente, así que hereda cabeceras y tiempo de espera.
  const captcha: CaptchaSolver =
    overrides.captcha ?? new AltchaCaptchaSolver(() => http.get<Challenge>('/captcha/challenge'))
  const authRepository: AuthRepository = new HttpAuthRepository(http, captcha)
  const catalogRepository: CatalogRepository = new HttpCatalogRepository(http)
  const favoritesRepository: FavoritesRepository = new HttpFavoritesRepository(http)
  const regionRepository: RegionRepository = new HttpRegionRepository(http)
  const accountRepository: AccountRepository = new HttpAccountRepository(http)
  const subscriptionRepository: SubscriptionRepository = new HttpSubscriptionRepository(http)
  const notificationsRepository: NotificationsRepository = new HttpNotificationsRepository(http)
  const preferenceStore = new AsyncPreferenceStore()
  // La cesta va al servidor cuando hay sesión y al dispositivo cuando no. Se decide en cada
  // operación, no al construir el contenedor: la sesión cambia con la aplicación abierta.
  const cartStorage = new SessionAwareCartStorage(
    new AsyncCartStorage(new AsyncPreferenceStore()),
    new HttpCartStorage(http),
    () => useSessionStore.getState().status === 'authenticated',
  )
  const savedCartRepository = new HttpSavedCartRepository(http)
  const quoteRepository = new HttpQuoteRepository(http)
  const ordersRepository: OrdersRepository = new HttpOrdersRepository(http)
  const paymentMethodsRepository = new HttpPaymentMethodsRepository(http)
  const billingRepository = new HttpBillingRepository(http)
  // Uno solo para los dos casos de uso: el saldo y el histórico salen del mismo monedero, y dos
  // instancias sobre el mismo cliente HTTP solo serían dos sitios donde tocar cuando cambie.
  const walletRepository: WalletRepository = new HttpWalletRepository(http)

  return {
    http,
    authRepository,
    sessionStorage,
    signIn: new SignIn(authRepository, sessionStorage),
    signOut: new SignOut(authRepository, sessionStorage),
    restoreSession: new RestoreSession(authRepository, sessionStorage),
    register: new Register(authRepository),
    activateAccount: new ActivateAccount(authRepository),
    resendActivation: new ResendActivation(authRepository),
    requestPasswordReset: new RequestPasswordReset(authRepository),
    confirmPasswordReset: new ConfirmPasswordReset(authRepository),
    browseProducts: new BrowseProducts(catalogRepository),
    loadHome: new LoadHome(catalogRepository),
    listCategories: new ListCategories(catalogRepository),
    toggleFavorite: new ToggleFavorite(favoritesRepository),
    listFavorites: new ListFavorites(favoritesRepository),
    listLanguages: new ListLanguages(regionRepository),
    listCurrencies: new ListCurrencies(regionRepository),
    loadPreferences: new LoadPreferences(preferenceStore),
    savePreferences: new SavePreferences(preferenceStore),
    listFavoriteIds: new ListFavoriteIds(favoritesRepository),
    getProductDetail: new GetProductDetail(catalogRepository),
    listReviews: new ListReviews(catalogRepository),
    listRelatedProducts: new ListRelatedProducts(catalogRepository),
    loadCart: new LoadCart(cartStorage),
    loadSavedCart: new LoadSavedCart(savedCartRepository),
    addToCart: new AddToCart(cartStorage),
    updateQuantity: new UpdateQuantity(cartStorage),
    removeFromCart: new RemoveFromCart(cartStorage),
    clearCart: new ClearCart(cartStorage),
    quoteCart: new QuoteCart(quoteRepository),
    saveForLater: new SaveForLater(cartStorage, savedCartRepository),
    moveToCart: new MoveToCart(cartStorage, savedCartRepository),
    mergeGuestCart: new MergeGuestCart(savedCartRepository),
    mergeGuestLines: new MergeGuestLines(new HttpCartMerger(http)),
    cartStorage,
    listOrders: new ListOrders(ordersRepository),
    getOrderDetail: new GetOrderDetail(ordersRepository),
    getOrderTracking: new GetOrderTracking(ordersRepository),
    cancelOrder: new CancelOrder(ordersRepository),
    listAddresses: new ListAddresses(new HttpAddressRepository(http)),
    createAddress: new CreateAddress(new HttpAddressRepository(http)),
    listRegions: new ListRegions(new HttpShippingRepository(http)),
    quoteShipping: new QuoteShipping(new HttpShippingRepository(http)),
    placeOrder: new PlaceOrder(new HttpCheckoutRepository(http)),
    getWalletBalance: new GetWalletBalance(walletRepository),
    listWalletTransactions: new ListWalletTransactions(walletRepository),
    changePassword: new ChangePassword(accountRepository),
    listSessions: new ListSessions(accountRepository),
    revokeSession: new RevokeSession(accountRepository),
    requestAccountDeletion: new RequestAccountDeletion(accountRepository),
    confirmAccountDeletion: new ConfirmAccountDeletion(accountRepository),
    getSubscription: new GetSubscription(subscriptionRepository),
    cancelSubscription: new CancelSubscription(subscriptionRepository),
    listNotifications: new ListNotifications(notificationsRepository),
    markNotificationRead: new MarkNotificationRead(notificationsRepository),
    markAllNotificationsRead: new MarkAllNotificationsRead(notificationsRepository),
    archiveNotification: new ArchiveNotification(notificationsRepository),
    listPaymentMethods: new ListPaymentMethods(paymentMethodsRepository),
    // Con autenticador: si el banco pide 3-D Secure, el SDK abre el reto y DESPUÉS se confirma el
    // cobro contra el backend, que es quien decide si el dinero llegó.
    payWithSavedCard: new PayWithSavedCard(paymentMethodsRepository, new StripeCardAuthenticator()),
    getBillingConfig: new GetBillingConfig(billingRepository),
    addCard: new AddCard(billingRepository, new StripeCardSetupGateway()),
    // PayPal y tarjeta nueva pasan por la pasarela: se abre su página en el navegador del sistema y
    // al volver se confirma contra el backend, que es quien decide si el dinero llegó.
    payWithProvider: new PayWithProvider(
      new HttpPaymentIntentRepository(http),
      new ExpoPaymentApprovalGateway(),
    ),
  }
}
