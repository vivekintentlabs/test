import { Binding, BindingRegistry, FormProperty } from 'ngx-schema-form';

/**
 * Helper function for registering events for custom bindings
 *
 * Copy/pasted from: https://github.com/daniele-pecora/ngx-schema-form-widgets-material/blob/b944614de3a1847bba2a587b5804dc01660d18b5/projects/ngx-schema-form-widgets-material/src/lib/widgets/bindings-registry-helper.ts
 *
 * @param this_context
 * @param eventId
 * @param event
 * @param bindingRegistry
 * @param formProperty
 */
export function triggerBinding(this_context, eventId, event, bindingRegistry: BindingRegistry, formProperty: FormProperty) {
    const bindings: Binding[] = bindingRegistry.get(formProperty.path);
    if ((bindings || []).length) {
        bindings.forEach((binding) => {
            for (const evId in binding) {
                if (eventId === evId) {
                    let _function: ((event: any, formProperty: FormProperty) => void) | Array<(event: any, formProperty: FormProperty) => void> = binding[eventId];
                    _function = Array.isArray(_function) ? _function : [_function];
                    _function.forEach((item, ix, all) => {
                        if (item instanceof Function) {
                            item.bind(this_context)(event, formProperty);
                        }
                    });
                }
            }
        });
    }
}
