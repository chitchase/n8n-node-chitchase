import type { INodeProperties } from 'n8n-workflow';

const phoneField: INodeProperties = {
	displayName: 'Phone Number ID',
	name: 'phoneNumberId',
	type: 'string',
	default: '',
	placeholder: 'Overrides default from ChitChase credentials (UUID)',
	description:
		'Optional. When set, overrides the credential “Default Phone Number ID” for this node (template filters, template dropdown, attach on create).',
	displayOptions: {
		show: {
			resource: ['template', 'message'],
		},
	},
};

export const chitchaseProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Template', value: 'template' },
			{ name: 'Message', value: 'message' },
		],
		default: 'template',
	},
	phoneField,
	{
		displayName: 'Operation',
		name: 'templateOperation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['template'],
			},
		},
		options: [
			{ name: 'Create', value: 'create', action: 'Create a template' },
			{ name: 'Delete', value: 'delete', action: 'Delete a template' },
			{ name: 'List by Phone', value: 'listByPhone', action: 'List templates for a phone number' },
			{ name: 'List Templates', value: 'listTemplates', action: 'List WhatsApp templates' },
			{ name: 'Sync From Meta', value: 'sync', action: 'Sync templates from Meta' },
			{ name: 'Update', value: 'update', action: 'Update a template' },
		],
		default: 'listTemplates',
	},
	{
		displayName: 'Operation',
		name: 'messageOperation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Send to Conversation',
				value: 'sendConversation',
				action: 'Send a WhatsApp template to one conversation',
			},
			{ name: 'Broadcast', value: 'broadcast', action: 'Broadcast a template to conversations' },
		],
		default: 'sendConversation',
	},

	// --- Template: list ---
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['listTemplates'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['listTemplates'],
				returnAll: [false],
			},
		},
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['listTemplates'],
				returnAll: [false],
			},
		},
		typeOptions: { minValue: 1 },
		default: 1,
	},
	{
		displayName: 'Split Into Items',
		name: 'splitIntoItems',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['listTemplates', 'listByPhone'],
			},
		},
		default: false,
		description:
			'Whether to output one n8n item per template row instead of a single aggregate response',
	},
	{
		displayName: 'Filters',
		name: 'listFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['listTemplates'],
			},
		},
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'Marketing, utility, or authentication',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				description: 'Draft, pending, approved, rejected, paused',
			},
			{
				displayName: 'Phone Number ID',
				name: 'phoneNumberId',
				type: 'string',
				default: '',
				description: 'Filter by phone number UUID (overrides node/credential default for this filter only)',
			},
		],
	},

	// --- Template: create / update shared-ish ---
	{
		displayName: 'Template ID',
		name: 'templateId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['update', 'delete'],
			},
		},
		description: 'ChitChase template UUID',
	},
	{
		displayName: 'Name',
		name: 'templateName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'updateTemplateName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['update'],
			},
		},
		description: 'Optional new template name',
	},
	{
		displayName: 'Category',
		name: 'category',
		type: 'options',
		options: [
			{ name: 'Marketing', value: 'marketing' },
			{ name: 'Utility', value: 'utility' },
			{ name: 'Authentication', value: 'authentication' },
		],
		default: 'utility',
		required: true,
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create'],
			},
		},
	},
	{
		displayName: 'Category (Optional)',
		name: 'updateCategory',
		type: 'string',
		default: '',
		placeholder: 'marketing, utility, or authentication',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['update'],
			},
		},
		description: 'Leave empty to omit from the update request',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'string',
		default: 'en_US',
		required: true,
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create', 'update'],
			},
		},
		description: 'E.g. en_US.',
	},
	{
		displayName: 'Body Text',
		name: 'bodyText',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create', 'update'],
			},
		},
		description: 'Use {{1}}, {{2}}, … for variables (Meta/WhatsApp style)',
	},
	{
		displayName: 'Header Text',
		name: 'headerText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Footer Text',
		name: 'footerText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Body Example (JSON Array)',
		name: 'bodyExampleJson',
		type: 'string',
		default: '[]',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create', 'update'],
			},
		},
		description:
			'Sample values for {{1}}, {{2}}, … in order, as JSON array. Required by Meta for approval, e.g. ["Jane","1234"]. Use [] if there are no variables.',
	},
	{
		displayName: 'Buttons (JSON)',
		name: 'buttonsJson',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				templateOperation: ['create', 'update'],
			},
		},
		description: 'Optional JSON array of button definitions (quick_reply, URL, phone_number)',
	},

	// --- Message: send conversation ---
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['sendConversation'],
			},
		},
	},
	{
		displayName: 'Meta Template ID',
		name: 'metaId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['sendConversation'],
			},
		},
		description:
			'Meta template identifier required by ChitChase for this endpoint. Find it in the ChitChase UI or API if not exposed in list responses.',
	},
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
			},
		},
	},
	{
		displayName: 'Template',
		name: 'templateSource',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
			},
		},
		options: [
			{ name: 'Choose From List', value: 'list' },
			{ name: 'Manual Name & Language', value: 'manual' },
		],
		default: 'manual',
		description: 'List uses templates for the effective Phone Number ID (credential or node override)',
	},
	{
		displayName: 'Template Name or ID',
		name: 'templateSelection',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
		},
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
				templateSource: ['list'],
			},
		},
		default: '',
	},
	{
		displayName: 'Template Name',
		name: 'broadcastTemplateName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
				templateSource: ['manual'],
			},
		},
	},
	{
		displayName: 'Language',
		name: 'broadcastLanguage',
		type: 'string',
		default: 'en_US',
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
				templateSource: ['manual'],
			},
		},
	},

	// --- Parameters (message + could template send) ---
	{
		displayName: 'Template Parameters',
		name: 'parametersMode',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['sendConversation', 'broadcast'],
			},
		},
		options: [
			{ name: 'Fixed Order', value: 'simple' },
			{ name: 'JSON / Expression', value: 'json' },
		],
		default: 'simple',
		description:
			'Runtime values for {{1}}, {{2}}, … must be in the same order as in the approved template body',
	},
	{
		displayName: 'Values',
		name: 'parametersUi',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['sendConversation', 'broadcast'],
				parametersMode: ['simple'],
			},
		},
		default: { values: [{ value: '' }] },
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Parameters (JSON)',
		name: 'parametersJson',
		type: 'string',
		typeOptions: { rows: 2 },
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['sendConversation', 'broadcast'],
				parametersMode: ['json'],
			},
		},
		default: '[]',
		description: 'JSON array of strings, e.g. ["Alice","Order #99"] or ={{ [$JSON.name, $JSON.code] }}',
	},

	// --- Broadcast conversation IDs ---
	{
		displayName: 'Conversation IDs',
		name: 'conversationIdsMode',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
			},
		},
		options: [
			{ name: 'One per Row', value: 'simple' },
			{ name: 'JSON / Expression', value: 'json' },
		],
		default: 'simple',
	},
	{
		displayName: 'IDs',
		name: 'conversationIdsUi',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
				conversationIdsMode: ['simple'],
			},
		},
		default: { ids: [{ id: '' }] },
		options: [
			{
				displayName: 'IDs',
				name: 'ids',
				values: [
					{
						displayName: 'Conversation ID',
						name: 'id',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Conversation IDs (JSON)',
		name: 'conversationIdsJson',
		type: 'string',
		typeOptions: { rows: 2 },
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['broadcast'],
				conversationIdsMode: ['json'],
			},
		},
		default: '[]',
		description: 'JSON array of conversation UUID strings',
	},

	{
		displayName: 'Header Image (Binary Property)',
		name: 'binaryPropertyName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				messageOperation: ['sendConversation', 'broadcast'],
			},
		},
		description: 'Optional: name of the input binary field containing the template header image',
	},
];
