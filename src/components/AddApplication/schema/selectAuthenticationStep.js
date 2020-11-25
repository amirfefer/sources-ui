import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { useIntl } from 'react-intl';

import componentTypes from '@data-driven-forms/react-form-renderer/dist/cjs/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/dist/cjs/validator-types';

import { Text, TextVariants } from '@patternfly/react-core/dist/js/components/Text/Text';
import { TextContent } from '@patternfly/react-core/dist/js/components/Text/TextContent';

import { AuthTypeSetter } from '../AuthTypeSetter';

export const SelectAuthenticationDescription = ({ applicationTypeName, authenticationTypeName }) => {
  const intl = useIntl();

  return (
    <TextContent>
      <Text component={TextVariants.p}>
        {intl.formatMessage(
          {
            id: 'sources.selectAuthenticationDescription',
            defaultMessage:
              'Selected application { applicationTypeName } supports { authenticationTypeName } authentication type. You can use already defined authentication values or define new.',
          },
          { applicationTypeName, authenticationTypeName }
        )}
      </Text>
    </TextContent>
  );
};

SelectAuthenticationDescription.propTypes = {
  applicationTypeName: PropTypes.string,
  authenticationTypeName: PropTypes.string,
};

export const generateAuthSelectionOptions = ({ authenticationValues, appType, supportedAuthTypeName, supportedAuthType }) =>
  authenticationValues
    .filter(({ authtype }) => authtype === supportedAuthType)
    .map((values) => {
      const includeUsername = values.username ? `-${values.username}` : '';
      const includeAppName = appType ? `-${appType.display_name}` : `-unused-${values.id}`;
      const label = `${supportedAuthTypeName}${includeUsername}${includeAppName}`;

      return {
        label,
        value: values.id,
      };
    });

const selectAuthenticationStep = ({ intl, source, authenticationValues, sourceType, app }) => {
  const nextStep = ({ values: { authtype, authentication } }) =>
    `${sourceType.name}-${app.id}-${authtype || authentication?.authtype}`;

  const fields = [
    {
      component: 'description',
      name: 'authtypesetter',
      Content: AuthTypeSetter,
      authenticationValues,
      hideField: true,
    },
  ];

  const ifAppSupported = app.supported_source_types.includes(sourceType.name);
  const isAppAvailable = !source.applications?.find(({ application_type_id }) => application_type_id === app.id);

  if (ifAppSupported && isAppAvailable) {
    const supportedAuthTypes = get(app, `supported_authentication_types[${sourceType.name}]`, []);

    supportedAuthTypes.forEach((supportedAuthType) => {
      const hasAvailableAuthentications = authenticationValues.find(({ authtype }) => authtype === supportedAuthType);

      if (hasAvailableAuthentications) {
        const supportedAuthTypeName = get(sourceType, `schema.authentication`, {}).find(({ type }) => type === supportedAuthType)
          .name;

        fields.push({
          component: componentTypes.SUB_FORM,
          name: `${app.name}-subform`,
          fields: [
            {
              name: `${app.name}-select-authentication-summary`,
              component: 'description',
              Content: SelectAuthenticationDescription,
              applicationTypeName: app.display_name,
              authenticationTypeName: supportedAuthTypeName,
            },
            {
              component: componentTypes.RADIO,
              name: 'selectedAuthentication',
              label: intl.formatMessage({
                id: 'sources.selectAuthenticationTitle',
                defaultMessage: 'Select authentication',
              }),
              isRequired: true,
              validate: [{ type: validatorTypes.REQUIRED }],
              options: [
                {
                  label: intl.formatMessage(
                    {
                      id: 'sources.selectAuthenticationradioLabel',
                      defaultMessage: 'Define new { supportedAuthTypeName }',
                    },
                    { supportedAuthTypeName }
                  ),
                  value: `new-${supportedAuthType}`,
                },
                ...generateAuthSelectionOptions({
                  authenticationValues,
                  appType: app,
                  supportedAuthTypeName,
                  supportedAuthType,
                }),
              ],
            },
          ],
        });
      }
    });
  }

  return {
    name: 'selectAuthentication',
    title: intl.formatMessage({
      id: 'sources.selectAuthenticationTitle',
      defaultMessage: 'Select authentication',
    }),
    fields,
    nextStep,
  };
};

export default selectAuthenticationStep;
