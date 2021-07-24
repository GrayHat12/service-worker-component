import React, { FC } from 'react';
import toUint8Array from './urlb64touint8array';

import { ServiceWorkerContextProps, ServiceWorkerContextType } from './types';

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

const ServiceWorkerContext = React.createContext<ServiceWorkerContextType>({
    installable: false,
    install: () => Promise.resolve({ message: 'Not Implemented yet', success: false }),
    installWaitingServiceWorker: () => { },
    swUpdateAvailable: false,
    subscribeToPushNotifications: () => Promise.resolve({ message: "Not Implemented", success: false }),
    unsubscribeFromPushNotifications: () => Promise.resolve({ message: "Not Implemented", success: false }),
});

export function useServiceWorker() {
    return React.useContext(ServiceWorkerContext);
}

let deferredPrompt: BeforeInstallPromptEvent | undefined;

export const ServiceWorkerProvider: FC<ServiceWorkerContextProps> = (props) => {

    const [isswinstallable, setIsSWInstallable] = React.useState(false);
    const [alertsEnabled, setAlertsEnabled] = React.useState(false);
    const [currentSWRegistration, setCurrentSWRegistration] = React.useState<ServiceWorkerRegistration | null | undefined>();

    // a new service worker waiting to be installed
    const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);

    const updateSubscriptionOnServer = (subscription: any) => {
        props.onUpdateNotificationSubscription && props.onUpdateNotificationSubscription(subscription);
    };

    async function subscribeToPushNotifications() {
        if (!currentSWRegistration) return { message: 'No currently installed service worker', success: false };
        if (!props.APPLICATION_SERVER_PUBLIC_KEY) return { message: 'APPLICATION_SERVER_PUBLIC_KEY not provided', success: false };
        const applicationServerKey = toUint8Array(props.APPLICATION_SERVER_PUBLIC_KEY);
        try {
            let subscription = await currentSWRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            updateSubscriptionOnServer(subscription);
            setAlertsEnabled(true);
            return { message: 'Subscribed to push notifications', success: true, subscription };
        } catch (err) {
            console.log('Failed to subscribe the user: ', err);
            setAlertsEnabled(false);
            return { message: 'Failed to subscribe the user', success: false, error: err };
        };
    }

    async function unsubscribeFromPushNotifications() {
        if (!currentSWRegistration) return { message: 'No currently installed service worker', success: false };
        let res = { message: '', success: false, error: undefined };
        try {
            let subscription = await currentSWRegistration.pushManager.getSubscription();
            if (subscription) {
                let unsubscribed = await subscription.unsubscribe();
                if (unsubscribed) {
                    res.message = 'Unsubscribed Successfully';
                    res.success = true;
                }
                else res.message = 'Failed to unsubscribe';
            } else {
                res.message = 'Subscription Not Found';
            }
        }
        catch (error) {
            res.message = 'Some error occured';
            res.error = error;
        }
        updateSubscriptionOnServer(null);
        setAlertsEnabled(false);
        return res;
    }

    const onSWUpdate = (registration: ServiceWorkerRegistration) => {
        setWaitingWorker(registration.waiting);
    };

    const onRecieveSW = (registration: ServiceWorkerRegistration) => {
        //console.log('registration', registration);
        setCurrentSWRegistration(registration);
        registration.pushManager.getSubscription().then((subscription) => {
            let isSubscribed = !(subscription === null);
            setAlertsEnabled(isSubscribed);
            //updateSubscriptionOnServer(subscription);
        });
    };

    const installWaitingWorker = () => {
        waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload(true);
    };

    function beforeinstallprompt(e: BeforeInstallPromptEvent) {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setIsSWInstallable(true);
    }

    function appinstalled() {
        props.onAppInstalled && props.onAppInstalled();
    }

    React.useEffect(() => {
        window.addEventListener("beforeinstallprompt", beforeinstallprompt);
        window.addEventListener('appinstalled', appinstalled);
        let removeEventListenersAndUnsubscribe = () => {
            window.removeEventListener("beforeinstallprompt", beforeinstallprompt);
            window.removeEventListener("appinstalled", appinstalled);
        };
        return removeEventListenersAndUnsubscribe;
    }, []);

    React.useEffect(() => {
        props.serviceWorker.register({ onUpdate: onSWUpdate, onRecieveSW });
    }, [props.serviceWorker]);

    React.useEffect(() => {
        if (Notification.permission === 'denied') {
            updateSubscriptionOnServer(null);
            return;
        }
    }, [alertsEnabled]);

    async function install() {
        if (!isswinstallable) return { message: 'Not installable', success: false };
        if (!deferredPrompt) {
            return { message: 'Deferred Prompt not present yet. Try again later', success: false };
        }
        setIsSWInstallable(false);
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        try {
            let choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                return { message: 'User accepted the install prompt', success: true };
            } else {
                return { message: 'User dismissed the install prompt', success: false };
            }
        } catch (err) {
            console.error(err);
            return { message: 'Some error occured', success: false, error: err };
        }
    }

    let value: ServiceWorkerContextType = {
        installable: isswinstallable,
        install,
        installWaitingServiceWorker: installWaitingWorker,
        swUpdateAvailable: waitingWorker ? true : false,
        subscribeToPushNotifications,
        unsubscribeFromPushNotifications
    };

    return (
        <ServiceWorkerContext.Provider value={value}>
            {props.children}
        </ServiceWorkerContext.Provider>
    );
}