import { serial as test } from 'ava'

import './helpers/TestJob'
import './helpers/Listener'
import '../src/Drivers/RabbitDriver'

test.beforeEach(t => {
	t.context.driver = new RabbitDriver(null, {
		host: 'localhost',
		port: process.env.RABBIT_PORT
	})

	return t.context.driver.connect()
})

test.afterEach.always(t => t.context.driver.destroy())

test('dispatch', async t => {
	const payload = { time: Date.now() }
	const job = new TestJob({ ...payload })

	await t.context.driver.dispatch(job)

	return Listener(t.context.driver, job => t.deepEqual(job.data.data, payload))
})

test('retry dispatch', async t => {
	const payload = { time: Date.now() }
	const job = new TestJob({ ...payload })
	let tries = 0

	await t.context.driver.dispatch(job.$tries(2))

	return Listener(t.context.driver, job => {
		t.is(job.tries, 2)
		t.deepEqual(job.data.data, payload)

		if(++tries === 1 || tries > 2) {
			throw new Error
		}
	})
})
