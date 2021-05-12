import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';

const APP_INSIGHTS_INSTRUMENTATION_KEY = '2ec047c1-12ab-4e4e-86df-4c43e8af07d2';

const browserHistory = createBrowserHistory({ basename: '' });
export const reactPlugin = new ReactPlugin();

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: APP_INSIGHTS_INSTRUMENTATION_KEY,
    maxBatchInterval: 0,
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory }
    }
  }
});

appInsights.loadAppInsights();

export default appInsights;