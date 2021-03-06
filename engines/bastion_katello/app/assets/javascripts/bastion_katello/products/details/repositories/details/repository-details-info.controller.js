/**
 * @ngdoc object
 * @name  Bastion.repositories.controller:RepositoryDetailsInfoController
 *
 * @requires $scope
 * @requires $q
 * @requires translate
 * @requires Notification
 * @requires ContentCredential
 * @requires CurrentOrganization
 * @requires Checksum
 * @requires DownloadPolicy
 * @requires OstreeUpstreamSyncPolicy
 * @requires Architecture
 * @requires YumContentUnits
 *
 * @description
 *   Provides the functionality for the repository details info page.
 */
angular.module('Bastion.repositories').controller('RepositoryDetailsInfoController',
    ['$scope', '$q', 'translate', 'Notification', 'ContentCredential', 'CurrentOrganization', 'Checksum', 'DownloadPolicy', 'YumContentUnits', 'OstreeUpstreamSyncPolicy', 'Architecture',
    function ($scope, $q, translate, Notification, ContentCredential, CurrentOrganization, Checksum, DownloadPolicy, YumContentUnits, OstreeUpstreamSyncPolicy, Architecture) {
        $scope.organization = CurrentOrganization;

        $scope.progress = {uploading: false};

        $scope.repository.$promise.then(function () {
            $scope.uploadURL = 'katello/api/v2/repositories/' + $scope.repository.id + '/upload_content';
        });

        $scope.gpgKeys = function () {
            var deferred = $q.defer();

            ContentCredential.queryUnpaged(function (contentCredentials) {
                var results = contentCredentials.results;

                results = results.filter(function(obj) {
                    if (obj.content_type === "gpg_key") {
                        return true;
                    }
                    return false;
                });

                results.unshift({id: null, name: ''});
                deferred.resolve(results);
            });

            return deferred.promise;
        };

        $scope.certs = function () {
            var deferred = $q.defer();

            ContentCredential.queryUnpaged(function (contentCredentials) {
                var results = contentCredentials.results;

                results = results.filter(function(obj) {
                    if (obj.content_type === "cert") {
                        return true;
                    }
                    return false;
                });

                results.unshift({id: null, name: ''});
                deferred.resolve(results);
            });

            return deferred.promise;
        };

        $scope.architectures = function () {
            var deferred = $q.defer();
            Architecture.queryUnpaged(function (architectures) {
                var results = architectures.results;
                results.map(function(i) {
                    i.id = i.name;
                });
                results.unshift({
                    id: 'noarch',
                    name: translate('Default'),
                    value: null
                });
                deferred.resolve(results);
            });
            return deferred.promise;
        };

        $scope.save = function (repository) {
            var deferred = $q.defer();
            if (!_.isEmpty(repository.commaTagsWhitelist)) {
                repository["docker_tags_whitelist"] = repository.commaTagsWhitelist.split(",").map(function(tag) {
                    return tag.trim();
                });
            } else {
                repository["docker_tags_whitelist"] = [];
            }

            repository.$update(function (response) {
                deferred.resolve(response);
                if (!_.isEmpty(response["docker_tags_whitelist"])) {
                    repository.commaTagsWhitelist = repository["docker_tags_whitelist"].join(", ");
                } else {
                    repository.commaTagsWhitelist = null;
                }
                Notification.setSuccessMessage(translate('Repository Saved.'));
            }, function (response) {
                deferred.reject(response);
                _.each(response.data.errors, function (errorMessage) {
                    Notification.setErrorMessage(translate("An error occurred saving the Repository: ") + errorMessage);
                });
            });

            return deferred.promise;
        };

        $scope.uploadContent = function (content) {
            var returnData, error, uploaded;

            if (content) {
                try {
                    returnData = angular.fromJson(angular.element(content).html());
                } catch (err) {
                    returnData = content;
                }

                if (!returnData) {
                    returnData = content;
                }

                if (returnData !== null && returnData.status === 'success') {
                    uploaded = returnData.filenames.join(', ');
                    Notification.setSuccessMessage(translate('Successfully uploaded content: ') + uploaded);
                    $scope.repository.$get();
                } else {
                    error = returnData.displayMessage;
                    Notification.setErrorMessage(translate('Error during upload: ') + error);
                }

                $scope.progress.uploading = false;
            }
        };

        $scope.uploadError = function (error, content) {
            if (angular.isString(content) && content.indexOf("Request Entity Too Large")) {
                error = translate('File too large. Please use the CLI instead.');
            } else {
                error = content;
            }
            Notification.setErrorMessage(translate('Error during upload: ') + error);
            $scope.progress.uploading = false;
        };

        $scope.checksums = Checksum.checksums;
        $scope.downloadPolicies = DownloadPolicy.downloadPolicies;
        $scope.ostreeUpstreamSyncPolicies = OstreeUpstreamSyncPolicy.syncPolicies;
        $scope.ignorableYumContentUnits = YumContentUnits.units;

        $scope.checksumTypeDisplay = function (checksum) {
            return Checksum.checksumType(checksum);
        };

        $scope.downloadPolicyDisplay = function (downloadPolicy) {
            return DownloadPolicy.downloadPolicyName(downloadPolicy);
        };

        $scope.clearUpstreamAuth = function () {
            $scope.repository['upstream_password'] = null;
            $scope.repository['upstream_auth_exists'] = false;
            $scope.repository['upstream_username'] = null;
            $scope.save($scope.repository);
        };
    }]
);
