module Katello
  class RepositoryTypeManager
    @repository_types = {}
    class << self
      private :new
      attr_reader :repository_types

      # Plugin constructor
      def register(id, &block)
        configured = SETTINGS[:katello][:content_types].nil? || SETTINGS[:katello][:content_types].with_indifferent_access[id]
        if find(id).blank? && configured
          repository_type = ::Katello::RepositoryType.new(id)
          repository_type.instance_eval(&block) if block_given?
          repository_types[id.to_s] = repository_type
        end
      end

      def creatable_repository_types
        repository_types.select do |repo_type, _|
          creatable_by_user?(repo_type)
        end
      end

      def creatable_by_user?(repository_type)
        return false unless (type = find(repository_type))
        type.allow_creation_by_user
      end

      def find(repository_type)
        repository_types[repository_type.to_s]
      end

      def find_content_type(katello_label)
        repository_types.values.each do |repo_type|
          repo_type.content_types.each do |content_type|
            return content_type if content_type.model_class::CONTENT_TYPE == katello_label.to_s
          end
        end
        nil
      end

      def find_content_type!(katello_label)
        find_content_type(katello_label) || fail("Couldn't find content type #{katello_label}")
      end

      def enabled?(repository_type)
        find(repository_type).present?
      end
    end
  end
end
