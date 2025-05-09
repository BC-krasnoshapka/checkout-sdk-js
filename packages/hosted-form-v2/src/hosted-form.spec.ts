import {
    PaymentIntegrationService,
    RequestError,
} from '@bigcommerce/checkout-sdk/payment-integration-api';
import {
    getErrorResponse,
    getErrorResponseBody,
    PaymentIntegrationServiceMock,
} from '@bigcommerce/checkout-sdk/payment-integrations-test-utils';

import { IframeEventListener } from './common/iframe';
import HostedField from './hosted-field';
import HostedFieldType from './hosted-field-type';
import HostedForm from './hosted-form';
import HostedFormOptions from './hosted-form-options';
import HostedFormOrderDataTransformer from './hosted-form-order-data-transformer';
import { getHostedFormOrderData } from './hosted-form-order-data.mock';
import { HostedInputEventMap, HostedInputEventType } from './iframe-content';
import {
    StoredCardHostedFormDataMock,
    StoredCardHostedFormInstrumentFieldsMock,
} from './stored-card-hosted-form.mock';

describe('HostedForm', () => {
    let callbacks: Pick<
        HostedFormOptions,
        'onBlur' | 'onCardTypeChange' | 'onEnter' | 'onFocus' | 'onValidate'
    >;
    let eventListener: IframeEventListener<HostedInputEventMap>;
    let fields: HostedField[];
    let form: HostedForm;
    let payloadTransformer: HostedFormOrderDataTransformer;
    let errorResponse: RequestError;
    let paymentIntegrationService: PaymentIntegrationService;

    const fieldPrototype: Partial<HostedField> = {
        attach: jest.fn(),
        detach: jest.fn(),
        getType: jest.fn(),
        submitForm: jest.fn(),
        submitStoredCardForm: jest.fn(),
        submitManualOrderForm: jest.fn(),
        validateForm: jest.fn(),
    };

    beforeEach(() => {
        paymentIntegrationService = new PaymentIntegrationServiceMock();
        payloadTransformer = new HostedFormOrderDataTransformer(paymentIntegrationService);
        callbacks = {
            onBlur: jest.fn(),
            onEnter: jest.fn(),
            onFocus: jest.fn(),
            onCardTypeChange: jest.fn(),
            onValidate: jest.fn(),
        };

        fields = [
            Object.create(fieldPrototype) as HostedField,
            Object.create(fieldPrototype) as HostedField,
            Object.create(fieldPrototype) as HostedField,
            Object.create(fieldPrototype) as HostedField,
        ];

        jest.spyOn(fields[0], 'getType').mockReturnValue(HostedFieldType.CardCode);
        jest.spyOn(fields[1], 'getType').mockReturnValue(HostedFieldType.CardExpiry);
        jest.spyOn(fields[2], 'getType').mockReturnValue(HostedFieldType.CardName);
        jest.spyOn(fields[3], 'getType').mockReturnValue(HostedFieldType.CardNumber);

        eventListener = new IframeEventListener('https://store.foobar.com');
        form = new HostedForm(fields, eventListener, callbacks);

        errorResponse = {
            ...getErrorResponse(),
            body: {
                ...getErrorResponseBody(),
                status: 'additional_action_required',
                additional_action_required: {
                    type: 'recaptcha_v2_verification',
                    data: {
                        key: 'recaptchakey123',
                    },
                },
            },
            errors: [],
            name: '',
            type: '',
            message: '',
        };
    });

    it('attaches all fields to document', async () => {
        fields.forEach((field) => jest.spyOn(field, 'attach').mockResolvedValue(undefined));

        await form.attach();

        expect(fields[0].attach).toHaveBeenCalled();
        expect(fields[1].attach).toHaveBeenCalled();
        expect(fields[2].attach).toHaveBeenCalled();
        expect(fields[3].attach).toHaveBeenCalled();
    });

    it('detaches all fields from document', async () => {
        fields.forEach((field) => jest.spyOn(field, 'detach').mockReturnValue(undefined));

        await form.detach();

        expect(fields[0].detach).toHaveBeenCalled();
        expect(fields[1].detach).toHaveBeenCalled();
        expect(fields[2].detach).toHaveBeenCalled();
        expect(fields[3].detach).toHaveBeenCalled();
    });

    it('submits payment by passing order data to number field', async () => {
        const field = fields.find((field) => field.getType() === HostedFieldType.CardNumber)!;
        const data = getHostedFormOrderData();
        const payload = {
            methodId: 'authorizenet',
            paymentData: { shouldSaveInstrument: true },
        };
        const response = {
            status: 'ok',
        };

        // TODO: remove ts-ignore and update test with related type (PAYPAL-4383)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        jest.spyOn(field, 'submitForm').mockResolvedValue({ payload: { response } });

        jest.spyOn(payloadTransformer, 'transform').mockReturnValue(data);

        await form.submit(payload, paymentIntegrationService, payloadTransformer);

        expect(payloadTransformer.transform).toHaveBeenCalledWith(payload, undefined);
        expect(field.submitForm).toHaveBeenCalledWith(
            fields.map((field) => field.getType()),
            data,
        );
    });

    it('submits payment again after human verification performed', async () => {
        // tslint:disable-next-line:no-non-null-assertion
        const field = fields.find((field) => field.getType() === HostedFieldType.CardNumber)!;
        const data = getHostedFormOrderData();
        const response = {
            status: 'ok',
        };
        const payload = {
            methodId: 'authorizenet',
            paymentData: { shouldSaveInstrument: true },
        };

        jest.spyOn(field, 'submitForm')
            // TODO: remove ts-ignore and update test with related type (PAYPAL-4383)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .mockResolvedValueOnce({ payload: { response: errorResponse } })
            // TODO: remove ts-ignore and update test with related type (PAYPAL-4383)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .mockResolvedValue({ payload: { response } });

        jest.spyOn(payloadTransformer, 'transform').mockReturnValue(data);

        await form.submit(payload, paymentIntegrationService, payloadTransformer);

        expect(field.submitForm).toHaveBeenCalledTimes(2);
    });

    it('notifies when card type changes', () => {
        eventListener.trigger({
            type: HostedInputEventType.CardTypeChanged,
            payload: { cardType: 'visa' },
        });

        expect(callbacks.onCardTypeChange).toHaveBeenCalledWith({ cardType: 'visa' });
    });

    it('notifies when validation happens', () => {
        const payload = {
            isValid: false,
            errors: {
                cardCode: [
                    {
                        fieldType: HostedFieldType.CardCode,
                        type: 'required',
                        message: 'Missing required data',
                    },
                ],
                cardExpiry: [],
                cardName: [],
                cardNumber: [],
            },
        };

        eventListener.trigger({ type: HostedInputEventType.Validated, payload });

        expect(callbacks.onValidate).toHaveBeenCalledWith(payload);
    });

    it('notifies when input receives focus event', () => {
        eventListener.trigger({
            type: HostedInputEventType.Focused,
            payload: { fieldType: HostedFieldType.CardCode },
        });

        expect(callbacks.onFocus).toHaveBeenCalledWith({ fieldType: HostedFieldType.CardCode });
    });

    it('notifies when input receives blur event', () => {
        eventListener.trigger({
            type: HostedInputEventType.Blurred,
            payload: { fieldType: HostedFieldType.CardCode },
        });

        expect(callbacks.onBlur).toHaveBeenCalledWith({ fieldType: HostedFieldType.CardCode });
    });

    it('notifies when enter key is pressed', async () => {
        jest.spyOn(fields[0], 'validateForm').mockResolvedValue(undefined);

        eventListener.trigger({
            type: HostedInputEventType.Entered,
            payload: { fieldType: HostedFieldType.CardCode },
        });

        await new Promise((resolve) => process.nextTick(resolve));

        expect(callbacks.onEnter).toHaveBeenCalledWith({ fieldType: HostedFieldType.CardCode });
    });

    it('submits stored card form data', async () => {
        // tslint:disable-next-line:no-non-null-assertion
        const field = fields.find((field) => field.getType() === HostedFieldType.CardNumber)!;

        jest.spyOn(field, 'submitStoredCardForm').mockResolvedValue({
            type: HostedInputEventType.StoredCardSucceeded,
        });

        await form.submitStoredCard({
            fields: StoredCardHostedFormInstrumentFieldsMock,
            data: StoredCardHostedFormDataMock,
        });

        expect(field.submitStoredCardForm).toHaveBeenCalledWith(
            StoredCardHostedFormInstrumentFieldsMock,
            StoredCardHostedFormDataMock,
        );
    });

    it('validates form when enter key is pressed', async () => {
        jest.spyOn(fields[0], 'validateForm').mockResolvedValue(undefined);

        eventListener.trigger({
            type: HostedInputEventType.Entered,
            payload: { fieldType: HostedFieldType.CardCode },
        });

        await new Promise((resolve) => process.nextTick(resolve));

        expect(fields[0].validateForm).toHaveBeenCalled();
    });

    it('returns card type', () => {
        eventListener.trigger({
            type: HostedInputEventType.CardTypeChanged,
            payload: { cardType: 'visa' },
        });

        expect(form.getCardType()).toBe('visa');
    });

    it('returns bin number', () => {
        eventListener.trigger({
            type: HostedInputEventType.BinChanged,
            payload: { bin: '411111' },
        });

        expect(form.getBin()).toBe('411111');
    });
});
