import type {
	ICredentialTestRequest,
	ICredentialType,
	IAuthenticateGeneric,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class ChitChaseApi implements ICredentialType {
	name = 'chitchaseApi';

	displayName = 'ChitChase API';

	icon: Icon = { light: 'file:../icons/chitchase.svg', dark: 'file:../icons/chitchase.dark.svg' };

	documentationUrl = 'https://chitchase.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Bearer token from your ChitChase account settings',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://chitchase.com',
			description: 'ChitChase API base URL (no trailing slash)',
		},
		{
			displayName: 'Default Phone Number ID',
			name: 'defaultPhoneNumberId',
			type: 'string',
			default: '',
			placeholder: '019a8243-370c-706b-b2ec-b7135e89e1a5',
			description:
				'Default WhatsApp phone number UUID in ChitChase. Used for template dropdowns and optional /api/hello validation.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/hello',
			method: 'GET',
		},
	};
}
