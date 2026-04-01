import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import {
	chitchaseApiRequest,
	getEffectivePhoneNumberId,
	parseConversationIds,
	parseTemplateParameters,
} from './transport';

async function fetchAllTemplatePages(
	this: IExecuteFunctions,
	credentials: IDataObject,
	baseQs: IDataObject,
): Promise<IDataObject[]> {
	const all: IDataObject[] = [];
	let page = 1;
	let lastPage = 1;
	const restQs = { ...baseQs };
	delete restQs.page;
	delete restQs.per_page;
	do {
		const res = (await chitchaseApiRequest.call(this, credentials, {
			method: 'GET',
			path: '/api/whatsapp-message-templates',
			qs: { ...restQs, page, per_page: 100 },
		})) as IDataObject;
		const data = (res.data as IDataObject[]) ?? [];
		all.push(...data);
		lastPage = (res.last_page as number) || 1;
		page += 1;
	} while (page <= lastPage);
	return all;
}

export async function executeChitChase(
	this: IExecuteFunctions,
	i: number,
	credentials: IDataObject,
): Promise<IDataObject | IDataObject[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation =
		resource === 'template'
			? (this.getNodeParameter('templateOperation', i) as string)
			: (this.getNodeParameter('messageOperation', i) as string);

	const phoneOverride = this.getNodeParameter('phoneNumberId', i, '') as string;
	const effectivePhone = getEffectivePhoneNumberId(credentials, phoneOverride);

	if (resource === 'template') {
		switch (operation) {
			case 'listTemplates': {
				const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
				const splitIntoItems = this.getNodeParameter('splitIntoItems', i, false) as boolean;
				const limit = this.getNodeParameter('limit', i, 50) as number;
				const page = this.getNodeParameter('page', i, 1) as number;
				const filters = this.getNodeParameter('listFilters', i, {}) as IDataObject;
				const qs: IDataObject = {};
				if (filters.category) qs.category = filters.category;
				if (filters.status) qs.status = filters.status;
				const filterPhone = (filters.phoneNumberId as string)?.trim();
				if (filterPhone) qs.phone_number_id = filterPhone;
				else if (effectivePhone) qs.phone_number_id = effectivePhone;

				let data: IDataObject[];
				if (returnAll) {
					qs.per_page = 100;
					data = await fetchAllTemplatePages.call(this, credentials, qs);
					if (splitIntoItems) return data;
					return { data, total: data.length };
				}
				qs.per_page = limit;
				qs.page = page;
				const res = (await chitchaseApiRequest.call(this, credentials, {
					method: 'GET',
					path: '/api/whatsapp-message-templates',
					qs,
				})) as IDataObject;
				const pageData = (res.data as IDataObject[]) ?? [];
				if (splitIntoItems) return pageData;
				return res;
			}
			case 'listByPhone': {
				if (!effectivePhone) {
					throw new NodeApiError(
						this.getNode(),
						{},
						{
							message:
								'Phone Number ID is required: set Default Phone Number ID on the credential or Phone Number ID on this node.',
						},
					);
				}
				const splitIntoItems = this.getNodeParameter('splitIntoItems', i, false) as boolean;
				const res = (await chitchaseApiRequest.call(this, credentials, {
					method: 'GET',
					path: `/api/phone-numbers/${effectivePhone}/templates`,
				})) as IDataObject;
				const templates = (res.templates as IDataObject[]) ?? [];
				if (splitIntoItems) return templates;
				return res;
			}
			case 'create': {
				const name = this.getNodeParameter('templateName', i) as string;
				const category = this.getNodeParameter('category', i) as string;
				const language = this.getNodeParameter('language', i) as string;
				const text = this.getNodeParameter('bodyText', i) as string;
				const headerText = this.getNodeParameter('headerText', i, '') as string;
				const footerText = this.getNodeParameter('footerText', i, '') as string;
				const bodyExampleRaw = this.getNodeParameter('bodyExampleJson', i, '[]') as string;
				let body_example: string[] = [];
				try {
					const parsed = JSON.parse(String(bodyExampleRaw || '[]').trim());
					if (Array.isArray(parsed)) body_example = parsed.map((x) => String(x));
					else throw new Error('not array');
				} catch {
					throw new NodeApiError(
						this.getNode(),
						{},
						{
							message:
								'Body example (JSON) must be a JSON array of sample strings for {{1}}, {{2}}, … e.g. ["Jane","1234"]',
						},
					);
				}
				const body: IDataObject = {
					name,
					category,
					language,
					text,
					body_example,
				};
				if (headerText) body.header_text = headerText;
				if (footerText) body.footer_text = footerText;
				if (effectivePhone) body.phone_number_id = effectivePhone;
				const buttonsRaw = this.getNodeParameter('buttonsJson', i, '') as string;
				if (buttonsRaw?.trim()) {
					try {
						body.buttons = JSON.parse(buttonsRaw);
					} catch {
						throw new NodeApiError(this.getNode(), {}, { message: 'Buttons (JSON) must be valid JSON' });
					}
				}
				return (await chitchaseApiRequest.call(this, credentials, {
					method: 'POST',
					path: '/api/whatsapp-message-templates',
					body,
				})) as IDataObject;
			}
			case 'update': {
				const templateId = this.getNodeParameter('templateId', i) as string;
				if (!templateId?.trim()) {
					throw new NodeApiError(this.getNode(), {}, { message: 'Template ID is required' });
				}
				const language = this.getNodeParameter('language', i) as string;
				const text = this.getNodeParameter('bodyText', i) as string;
				const headerText = this.getNodeParameter('headerText', i, '') as string;
				const footerText = this.getNodeParameter('footerText', i, '') as string;
				const bodyExampleRaw = this.getNodeParameter('bodyExampleJson', i, '[]') as string;
				let body_example: string[] = [];
				try {
					const parsed = JSON.parse(String(bodyExampleRaw || '[]').trim());
					if (Array.isArray(parsed)) body_example = parsed.map((x) => String(x));
					else throw new Error('not array');
				} catch {
					throw new NodeApiError(
						this.getNode(),
						{},
						{ message: 'Body example (JSON) must be a JSON array of strings' },
					);
				}
				const body: IDataObject = { language, text, body_example };
				const name = this.getNodeParameter('updateTemplateName', i, '') as string;
				if (name) body.name = name;
				const category = (this.getNodeParameter('updateCategory', i, '') as string)?.trim();
				if (category) body.category = category;
				if (headerText) body.header_text = headerText;
				if (footerText) body.footer_text = footerText;
				if (effectivePhone) body.phone_number_id = effectivePhone;
				const buttonsRaw = this.getNodeParameter('buttonsJson', i, '') as string;
				if (buttonsRaw?.trim()) {
					try {
						body.buttons = JSON.parse(buttonsRaw);
					} catch {
						throw new NodeApiError(this.getNode(), {}, { message: 'Buttons (JSON) must be valid JSON' });
					}
				}
				return (await chitchaseApiRequest.call(this, credentials, {
					method: 'PUT',
					path: `/api/whatsapp-message-templates/${templateId}`,
					body,
				})) as IDataObject;
			}
			case 'delete': {
				const templateId = this.getNodeParameter('templateId', i) as string;
				if (!templateId?.trim()) {
					throw new NodeApiError(this.getNode(), {}, { message: 'Template ID is required' });
				}
				return (await chitchaseApiRequest.call(this, credentials, {
					method: 'DELETE',
					path: `/api/whatsapp-message-templates/${templateId}`,
				})) as IDataObject;
			}
			case 'sync': {
				return (await chitchaseApiRequest.call(this, credentials, {
					method: 'POST',
					path: '/api/whatsapp-message-templates/sync',
				})) as IDataObject;
			}
			default:
				throw new NodeApiError(this.getNode(), {}, { message: `Unknown template operation: ${operation}` });
		}
	}

	// message resource
	switch (operation) {
		case 'sendConversation': {
			const conversationId = this.getNodeParameter('conversationId', i) as string;
			const metaId = this.getNodeParameter('metaId', i) as string;
			if (!conversationId?.trim() || !metaId?.trim()) {
				throw new NodeApiError(
					this.getNode(),
					{},
					{ message: 'Conversation ID and Meta template ID are required' },
				);
			}
			const paramMode = this.getNodeParameter('parametersMode', i, 'simple') as string;
			const parameters = parseTemplateParameters.call(this, i, paramMode);

			const form = new FormData();
			form.append('meta_id', metaId.trim());
			for (const p of parameters) {
				form.append('parameters[]', p);
			}
			const binaryProp = this.getNodeParameter('binaryPropertyName', i, '') as string;
			if (binaryProp?.trim()) {
				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProp.trim());
				const bin = this.helpers.assertBinaryData(i, binaryProp.trim());
				const blob = new Blob([new Uint8Array(buffer)], {
					type: bin.mimeType || 'application/octet-stream',
				});
				form.append('header_image', blob, bin.fileName || 'header');
			}

			return (await chitchaseApiRequest.call(this, credentials, {
				method: 'POST',
				path: `/api/conversations/${conversationId.trim()}/messages/whatsapp-message-template`,
				form,
			})) as IDataObject;
		}
		case 'broadcast': {
			const groupId = this.getNodeParameter('groupId', i) as string;
			if (!groupId?.trim()) {
				throw new NodeApiError(this.getNode(), {}, { message: 'Group ID is required' });
			}
			const templateSource = this.getNodeParameter('templateSource', i, 'manual') as string;
			let templateName: string;
			let language: string;
			if (templateSource === 'list') {
				const sel = this.getNodeParameter('templateSelection', i, '') as string;
				if (!sel?.trim() || sel === '__none') {
					throw new NodeApiError(
						this.getNode(),
						{},
						{ message: 'Select a template or choose manual template name / language' },
					);
				}
				try {
					const parsed = JSON.parse(sel) as { templateName?: string; language?: string };
					templateName = String(parsed.templateName ?? '');
					language = String(parsed.language ?? '');
				} catch {
					throw new NodeApiError(this.getNode(), {}, { message: 'Invalid template selection value' });
				}
				if (!templateName || !language) {
					throw new NodeApiError(
						this.getNode(),
						{},
						{ message: 'Template selection must include template name and language' },
					);
				}
			} else {
				templateName = this.getNodeParameter('broadcastTemplateName', i) as string;
				language = this.getNodeParameter('broadcastLanguage', i) as string;
				if (!templateName?.trim() || !language?.trim()) {
					throw new NodeApiError(
						this.getNode(),
						{},
						{ message: 'Template name and language are required for broadcast' },
					);
				}
			}

			const idsMode = this.getNodeParameter('conversationIdsMode', i, 'simple') as string;
			const conversationIds = parseConversationIds.call(this, i, idsMode);
			const paramMode = this.getNodeParameter('parametersMode', i, 'simple') as string;
			const parameters = parseTemplateParameters.call(this, i, paramMode);

			const form = new FormData();
			for (const id of conversationIds) {
				form.append('conversation_ids[]', id);
			}
			form.append('template_name', templateName.trim());
			form.append('language', language.trim());
			for (const p of parameters) {
				form.append('parameters[]', p);
			}
			const binaryProp = this.getNodeParameter('binaryPropertyName', i, '') as string;
			if (binaryProp?.trim()) {
				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProp.trim());
				const bin = this.helpers.assertBinaryData(i, binaryProp.trim());
				const blob = new Blob([new Uint8Array(buffer)], {
					type: bin.mimeType || 'application/octet-stream',
				});
				form.append('header_image', blob, bin.fileName || 'header');
			}

			return (await chitchaseApiRequest.call(this, credentials, {
				method: 'POST',
				path: `/api/groups/${groupId.trim()}/broadcast/send`,
				form,
			})) as IDataObject;
		}
		default:
			throw new NodeApiError(this.getNode(), {}, { message: `Unknown message operation: ${operation}` });
	}
}
