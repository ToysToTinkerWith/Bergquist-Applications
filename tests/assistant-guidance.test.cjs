const test = require('node:test')
const assert = require('node:assert/strict')
const { safeAssistantRoute } = require('../lib/assistantConversation.js')
const { buildAssistantRequest } = require('../lib/homeAssistant.js')

test('retired services links cannot be displayed by either assistant', () => {
  for (const href of ['/services', '/services/', '/services/website-maintenance', '/services/business-websites']) {
    assert.equal(safeAssistantRoute({ href, label: 'Retired page' }), null)
  }
  assert.deepEqual(safeAssistantRoute({ href: '/contact', label: 'Contact' }), { href: '/contact', label: 'Contact' })
})

test('assistant instructions reflect current design language and FAQ facts', () => {
  const request = buildAssistantRequest({ prompt: 'Which frameworks do you use?', history: [], routes: [], env: {} })
  const policy = request.messages[0].content
  assert.ok(policy.includes('range of design frameworks'))
  assert.ok(policy.includes('rather than naming Material UI or MUI'))
  assert.ok(policy.includes('$500 for the build plus $20/month'))
  assert.ok(policy.includes('The Services page has been removed'))
  assert.ok(policy.includes('Specialized components and third-party costs are scoped separately'))
})
