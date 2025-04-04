import { Response } from '@bigcommerce/request-sender';

import { PaymentErrorData, PaymentErrorResponseBody } from '../errors';
import HostedFieldType from '../hosted-field-type';
import { HostedFormErrorsData } from '../hosted-form-options';

import HostedInputInitializeErrorData from './hosted-input-initialize-error-data';
import HostedInputValidateResults from './hosted-input-validate-results';

// Event types
export enum HostedInputEventType {
    AttachSucceeded = 'HOSTED_INPUT:ATTACH_SUCCEEDED',
    AttachFailed = 'HOSTED_INPUT:ATTACH_FAILED',
    BinChanged = 'HOSTED_INPUT:BIN_CHANGED',
    Blurred = 'HOSTED_INPUT:BLURRED',
    Changed = 'HOSTED_INPUT:CHANGED',
    CardTypeChanged = 'HOSTED_INPUT:CARD_TYPE_CHANGED',
    Entered = 'HOSTED_INPUT:ENTERED',
    Focused = 'HOSTED_INPUT:FOCUSED',
    SubmitSucceeded = 'HOSTED_INPUT:SUBMIT_SUCCEEDED',
    SubmitFailed = 'HOSTED_INPUT:SUBMIT_FAILED',
    SubmitManualOrderSucceeded = 'HOSTED_INPUT:SUBMIT_MANUAL_ORDER_SUCCEEDED',
    SubmitManualOrderFailed = 'HOSTED_INPUT:SUBMIT_MANUAL_ORDER_FAILED',
    Validated = 'HOSTED_INPUT:VALIDATED',
    StoredCardSucceeded = 'HOSTED_INPUT:STORED_CARD_SUCCEEDED',
    StoredCardFailed = 'HOSTED_INPUT:STORED_CARD_FAILED',
}

// Event mapping
export interface HostedInputEventMap {
    [HostedInputEventType.AttachSucceeded]: HostedInputAttachSuccessEvent;
    [HostedInputEventType.AttachFailed]: HostedInputAttachErrorEvent;
    [HostedInputEventType.BinChanged]: HostedInputBinChangeEvent;
    [HostedInputEventType.Blurred]: HostedInputBlurEvent;
    [HostedInputEventType.Changed]: HostedInputChangeEvent;
    [HostedInputEventType.CardTypeChanged]: HostedInputCardTypeChangeEvent;
    [HostedInputEventType.Entered]: HostedInputEnterEvent;
    [HostedInputEventType.Focused]: HostedInputFocusEvent;
    [HostedInputEventType.SubmitManualOrderSucceeded]: HostedInputSubmitManualOrderSuccessEvent;
    [HostedInputEventType.SubmitManualOrderFailed]: HostedInputSubmitManualOrderErrorEvent;
    [HostedInputEventType.Validated]: HostedInputValidateEvent;
    [HostedInputEventType.StoredCardFailed]: HostedInputStoredCardErrorEvent;
    [HostedInputEventType.StoredCardSucceeded]: HostedInputStoredCardSucceededEvent;
}

// Events
export type HostedInputEvent =
    | HostedInputAttachSuccessEvent
    | HostedInputAttachErrorEvent
    | HostedInputBinChangeEvent
    | HostedInputBlurEvent
    | HostedInputChangeEvent
    | HostedInputCardTypeChangeEvent
    | HostedInputEnterEvent
    | HostedInputFocusEvent
    | HostedInputSubmitManualOrderSuccessEvent
    | HostedInputSubmitManualOrderErrorEvent
    | HostedInputValidateEvent
    | HostedInputStoredCardSucceededEvent
    | HostedInputStoredCardErrorEvent;

export interface HostedInputAttachSuccessEvent {
    type: HostedInputEventType.AttachSucceeded;
}

export interface HostedInputAttachErrorEvent {
    type: HostedInputEventType.AttachFailed;
    payload: {
        error: HostedInputInitializeErrorData;
    };
}

export interface HostedInputBinChangeEvent {
    type: HostedInputEventType.BinChanged;
    payload: {
        bin?: string;
    };
}

export interface HostedInputBlurEvent {
    type: HostedInputEventType.Blurred;
    payload: {
        fieldType: HostedFieldType;
        errors?: HostedFormErrorsData;
    };
}

export interface HostedInputChangeEvent {
    type: HostedInputEventType.Changed;
    payload: {
        fieldType: HostedFieldType;
    };
}

export interface HostedInputCardTypeChangeEvent {
    type: HostedInputEventType.CardTypeChanged;
    payload: {
        cardType?: string;
    };
}

export interface HostedInputFocusEvent {
    type: HostedInputEventType.Focused;
    payload: {
        fieldType: HostedFieldType;
    };
}

export interface HostedInputEnterEvent {
    type: HostedInputEventType.Entered;
    payload: {
        fieldType: HostedFieldType;
    };
}
export interface HostedInputSubmitManualOrderSuccessEvent {
    type: HostedInputEventType.SubmitManualOrderSucceeded;
    payload: {
        response: Response<unknown>;
    };
}

export interface HostedInputSubmitManualOrderErrorEvent {
    type: HostedInputEventType.SubmitManualOrderFailed;
    payload: {
        error: PaymentErrorData;
        response?: Response<PaymentErrorResponseBody>;
    };
}

export interface HostedInputValidateEvent {
    type: HostedInputEventType.Validated;
    payload: HostedInputValidateResults;
}

export interface HostedInputSubmitSuccessEvent {
    type: HostedInputEventType.SubmitSucceeded;
    payload: {
        response: Response<unknown>;
    };
}

export interface HostedInputSubmitErrorEvent {
    type: HostedInputEventType.SubmitFailed;
    payload: {
        error: PaymentErrorData;
        response?: Response<PaymentErrorResponseBody>;
    };
}

export interface HostedInputStoredCardSucceededEvent {
    type: HostedInputEventType.StoredCardSucceeded;
}

export interface HostedInputStoredCardErrorEvent {
    type: HostedInputEventType.StoredCardFailed;
    payload?: {
        errors?: string[];
        error?: PaymentErrorData;
        response?: Response<PaymentErrorResponseBody>;
    };
}
