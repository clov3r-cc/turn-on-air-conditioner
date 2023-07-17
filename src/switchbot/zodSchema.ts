import { z } from 'zod';

export const meterStatus = z.object({
	deviceId: z.string(),
	deviceType: z.string(),
	temperature: z.number(),
});

const airConditionerCommand = z.object({
	commandType: z.enum(['command']),
	command: z.enum(['setAll']),
	parameter: z.string(),
});

export type AirConditionerCommand = z.infer<typeof airConditionerCommand>;

export const controlCommandResponse = z.object({
	statusCode: z.number(),
	messsage: z.string(),
	body: z.object({}),
});
