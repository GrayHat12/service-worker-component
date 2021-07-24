export interface ServiceWorkerConfig {
    /*
    * when a waiting service worker is found. that is, an update for the service worker is available.
    */
    onUpdate: (registration: ServiceWorkerRegistration) => void;

    /*
    * currently registered service worker registration
    */
    onRecieveSW: (registration: ServiceWorkerRegistration) => void;

    /*
    * service worker registration successful.
    */
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
};

export interface ServiceWorkerPropType {
    /*
    * register the service worker with the given config
    */
    register: (config: ServiceWorkerConfig) => void;

    /*
    * unregister the service worker
    */
    unregister: () => void;
};

export interface ServiceWorkerContextProps {
    /*
    * This function is called when the user recieves a subscription object after accepting push notification permission prompt.
    */
    onUpdateNotificationSubscription?: (subscription: any) => void;

    /*
    * APPLICATION_SERVER_PUBLIC_KEY for communicating with the backend server
    */
    APPLICATION_SERVER_PUBLIC_KEY?: string;

    /*
    * Object containing methods to register and unregister a service worker.
    */
    serviceWorker: ServiceWorkerPropType;

    /*
    * Callback when user installs the PWA on device.
    */
    onAppInstalled?: () => void;
};

export interface ServiceWorkerContextType {

    /*
    * @returns true if the app is installable.
    * needs to be on android or chrome web view and not already installed to be installable. 
    */
    installable: boolean;

    /* 
    * prompt user to install app if it is installable.
    */
    install: () => Promise<{
        message: string;
        success: boolean;
        error?: any;
    }>;

    /*
    * Install waiting service worker.
    */
    installWaitingServiceWorker: () => void;

    /*
    * @returns true if a new version of service worker is available
    */
    swUpdateAvailable: boolean;

    /*
    * function is called when user grants permission for push notification.
    * You get a subscription object.
    */
    onPushNotificationSubscriptionObjectRecieve?: (subscription: any) => void;

    /*
    * use this function call to subscribe to web push notifications
    */
    subscribeToPushNotifications: () => Promise<{
        message: string;
        success: boolean;
        error?: any;
        subscription?: any;
    }>;

    /*
    * use this function call to unsubscribe from web push notifications
    */
    unsubscribeFromPushNotifications: () => Promise<{
        message: string;
        success: boolean;
        error?: any;
    }>;
};