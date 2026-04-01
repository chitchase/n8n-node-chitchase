import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type IDataObject,
} from 'n8n-workflow';
import { chitchaseProperties } from './chitchaseProperties';
import { executeChitChase } from './executeOperations';
import { chitchaseApiRequest, getEffectivePhoneNumberId } from './transport';

export class ChitChase implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ChitChase',
		name: 'chitChase',
		icon: { light: 'file:../../icons/chitchase.svg', dark: 'file:../../icons/chitchase.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle:
			'={{ $parameter.resource + ": " + ($parameter.resource === "template" ? $parameter.templateOperation : $parameter.messageOperation) }}',
		description:
			'Manage ChitChase WhatsApp message templates (CRUD, sync) and send template messages to conversations or broadcast to a group',
		defaults: {
			name: 'ChitChase',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'chitchaseApi',
				required: true,
			},
		],
		properties: chitchaseProperties,
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = (await this.getCredentials('chitchaseApi')) as IDataObject;
				const phoneOverride = this.getNodeParameter('phoneNumberId', '') as string;
				const effective = getEffectivePhoneNumberId(credentials, phoneOverride);
				if (!effective) {
					return [
						{
							name: 'Set Default Phone Number ID (Credentials) or Phone Number ID (Node)',
							value: '__none',
						},
					];
				}
				try {
					const data = (await chitchaseApiRequest.call(this, credentials, {
						method: 'GET',
						path: `/api/phone-numbers/${effective}/templates`,
					})) as IDataObject;
					const templates = (data.templates as IDataObject[]) ?? [];
					const options: INodePropertyOptions[] = [];
					for (const t of templates) {
						const id = String(t.id ?? '');
						const name = String(t.name ?? '');
						const translations = (t.translations as IDataObject[]) ?? [];
						for (const tr of translations) {
							const lang = String(tr.language ?? '');
							const status = String(tr.status ?? '');
							options.push({
								name: `${name} · ${lang} · ${status}`,
								value: JSON.stringify({ templateName: name, language: lang, templateId: id }),
							});
						}
					}
					if (!options.length) {
						return [{ name: 'No Templates Found for This Phone Number', value: '__none' }];
					}
					return options;
				} catch {
					return [
						{
							name: 'Could Not Load Templates — Check Credentials and Phone Number ID',
							value: '__none',
						},
					];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credential = (await this.getCredentials('chitchaseApi')) as IDataObject;
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await executeChitChase.call(this, i, credential);
				const outItems = Array.isArray(result) ? result : [result];
				for (const json of outItems) {
					returnData.push({ json: json as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
