const { DefaultReporter, CoverageReporter, VerboseReporter, GitHubActionsReporter, SummaryReporter } = require('@jest/reporters')

class Reporter extends SummaryReporter
{
	constructor()
	{
		super(...arguments)
	}

	printTestFileHeader(_testPath, config, result)
	{
		const console = result.console

		if(result.numFailingTests === 0 && !result.testExecError)
		{
			result.console = null
		}

		super.printTestFileHeader(...arguments)

		result.console = console
	}
}

module.exports = Reporter