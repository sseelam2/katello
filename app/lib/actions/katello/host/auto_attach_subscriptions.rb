module Actions
  module Katello
    module Host
      class AutoAttachSubscriptions < Actions::EntryAction
        middleware.use ::Actions::Middleware::RemoteAction

        def queue
          ::Katello::HOST_TASKS_QUEUE
        end

        def plan(host)
          action_subject(host)
          if ::Organization.find_by_id(host.organization_id).simple_content_access?
            fail ::Katello::HttpErrors::BadRequest, _("Auto attach is disabled in Simple Content Access mode")
          end
          plan_action(::Actions::Candlepin::Consumer::AutoAttachSubscriptions, :uuid => host.subscription_facet.uuid)
        end

        def finalize
          ::Katello::Pool.import_all
        end

        def resource_locks
          :link
        end
      end
    end
  end
end
