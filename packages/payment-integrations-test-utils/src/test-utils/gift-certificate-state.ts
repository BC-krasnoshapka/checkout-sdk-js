import {
    RequestError,
    StorefrontErrorResponseBody,
} from '@bigcommerce/checkout-sdk/payment-integration-api';

import GiftCertificate from './gift-certificate';

export default interface GiftCertificateState {
    data?: GiftCertificate[];
    errors: GiftCertificateErrorsState;
    statuses: GiftCertificateStatusesState;
}

export interface GiftCertificateErrorsState {
    applyGiftCertificateError?: RequestError<StorefrontErrorResponseBody>;
    removeGiftCertificateError?: RequestError<StorefrontErrorResponseBody>;
}

export interface GiftCertificateStatusesState {
    isApplyingGiftCertificate?: boolean;
    isRemovingGiftCertificate?: boolean;
}

export const DEFAULT_STATE: GiftCertificateState = {
    errors: {},
    statuses: {},
};
