import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export function normalizeBaseUrl(raw: string | undefined): string {
	const u = (raw || 'https://chitchase.com').trim();
	return u.replace(/\/+$/, '');
}

export function getEffectivePhoneNumberId(
	credentials: IDataObject,
	nodePhoneOverride: string,
): string {
	const fromNode = (nodePhoneOverride || '').trim();
	if (fromNode) return fromNode;
	const fromCred = (credentials.defaultPhoneNumberId as string) || '';
	return fromCred.trim();
}

export async function chitchaseApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	credentials: IDataObject,
	options: {
		method: 'GET' | 'POST' | 'PUT' | 'DELETE';
		path: string;
		qs?: IDataObject;
		body?: IDataObject;
		form?: FormData;
	},
): Promise<unknown> {
	const baseUrl = normalizeBaseUrl(credentials.baseUrl as string);
	const token = credentials.apiToken as string;
	const url = `${baseUrl}${options.path}`;

	const headers: IDataObject = {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`,
	};

	if (!options.form) {
		headers['Content-Type'] = 'application/json';
	}

	try {
		return await this.helpers.httpRequest({
			method: options.method,
			url,
			headers,
			qs: options.qs,
			body: options.form ?? options.body,
			json: !options.form,
		});
	} catch (error) {
		const err = error as JsonObject & { message?: string };
		const body = err.body as IDataObject | undefined;
		const msg =
			(typeof body?.message === 'string' && body.message) ||
			(typeof err.message === 'string' && err.message) ||
			'ChitChase API request failed';
		throw new NodeApiError(this.getNode(), error as JsonObject, { message: msg });
	}
}

export function parseTemplateParameters(
	this: IExecuteFunctions,
	itemIndex: number,
	mode: string,
): string[] {
	if (mode === 'json') {
		const raw = this.getNodeParameter('parametersJson', itemIndex, '') as string;
		if (!raw || !String(raw).trim()) {
			return [];
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(String(raw).trim());
		} catch {
			throw new NodeApiError(
				this.getNode(),
				{},
				{
					message: 'Parameters (JSON) must be valid JSON array of strings, e.g. ["Alice","123"]',
				},
			);
		}
		if (!Array.isArray(parsed)) {
			throw new NodeApiError(this.getNode(), {}, { message: 'Parameters (JSON) must be a JSON array' });
		}
		return parsed.map((v) => String(v));
	}

	const fixedValues = this.getNodeParameter('parametersUi', itemIndex, {}) as {
		values?: Array<{ value?: string }>;
	};
	const rows = fixedValues?.values ?? [];
	return rows.map((r) => String(r.value ?? '').trim()).filter((s) => s.length > 0);
}

export function parseConversationIds(this: IExecuteFunctions, itemIndex: number, mode: string): string[] {
	if (mode === 'json') {
		const raw = this.getNodeParameter('conversationIdsJson', itemIndex, '') as string;
		if (!raw || !String(raw).trim()) {
			throw new NodeApiError(
				this.getNode(),
				{},
				{ message: 'Conversation IDs (JSON) is required for broadcast' },
			);
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(String(raw).trim());
		} catch {
			throw new NodeApiError(
				this.getNode(),
				{},
				{ message: 'Conversation IDs (JSON) must be a JSON array of UUID strings' },
			);
		}
		if (!Array.isArray(parsed)) {
			throw new NodeApiError(this.getNode(), {}, { message: 'Conversation IDs (JSON) must be a JSON array' });
		}
		return parsed.map((v) => String(v).trim()).filter(Boolean);
	}
	const fixed = this.getNodeParameter('conversationIdsUi', itemIndex, {}) as {
		ids?: Array<{ id?: string }>;
	};
	const rows = fixed?.ids ?? [];
	const out = rows.map((r) => String(r.id ?? '').trim()).filter(Boolean);
	if (!out.length) {
		throw new NodeApiError(this.getNode(), {}, { message: 'Add at least one conversation ID for broadcast' });
	}
	return out;
}
